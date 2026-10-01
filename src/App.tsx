/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CharacterCustomization,
  ExamRecord,
  GameSaveState,
  MusicGenre,
  RandomEvent,
  SocialPost,
  SocialStory,
  SpotifyTrack,
  UniversityGoal,
  GameDifficulty,
  ColorThemeMode,
} from './types/game';
import {
  INITIAL_GAME_STATE,
  RANDOM_EVENTS,
  UPGRADE_ITEMS,
  ACHIEVEMENTS_LIST,
  DIFFICULTY_CONFIGS,
} from './data/initialData';
import { SOCIAL_AVATARS } from './data/socialMediaData';
import { MUSIC_BUFFS, detectGenreFromTrack } from './data/musicData';
import { sounds } from './utils/audio';
import { getBackendBaseUrl } from './utils/backendConfig';
import { MobileFrame } from './components/MobileFrame';
import { TopStatusBar } from './components/TopStatusBar';
import { ActiveTab, BottomNavBar } from './components/BottomNavBar';
import { StudyRoomView } from './components/views/StudyRoomView';
import { ExamsView } from './components/views/ExamsView';
import { ShopUpgradesView } from './components/views/ShopUpgradesView';
import { SocialMediaView } from './components/views/SocialMediaView';
import { StressReliefView } from './components/views/StressReliefView';
import { CharacterTargetView } from './components/views/CharacterTargetView';
import { ExamResultModal } from './components/modals/ExamResultModal';
import { MockExamSimulationModal } from './components/modals/MockExamSimulationModal';
import { RandomEventModal } from './components/modals/RandomEventModal';
import { FinalExamModal } from './components/modals/FinalExamModal';
import { SpotifyMusicModal } from './components/modals/SpotifyMusicModal';
import { CompanionsModal } from './components/modals/CompanionsModal';
import { ThemeProvider } from './context/ThemeContext';
import { YOUTUBE_TEACHER_POSTS_POOL } from './data/youtubeTeachersData';
import { CharacterInteraction, SocialComment } from './types/game';

const STORAGE_KEY = 'yks_mezun_tycoon_save_v1';

export default function App() {
  const [gameState, setGameState] = useState<GameSaveState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.version === 1) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_GAME_STATE;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('ROOM');
  const [isStudying, setIsStudying] = useState(false);
  const [pomodoroProgress, setPomodoroProgress] = useState(0);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [examResult, setExamResult] = useState<ExamRecord | null>(null);
  const [rankDelta, setRankDelta] = useState(0);
  const [activeEvent, setActiveEvent] = useState<RandomEvent | null>(null);
  const [eventToast, setEventToast] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to show notification toast for 15 seconds (15000ms) with proper cleanup
  const triggerToast = (message: string, durationMs: number = 15000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setEventToast(message);
    toastTimerRef.current = setTimeout(() => {
      setEventToast(null);
      toastTimerRef.current = null;
    }, durationMs);
  };
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [isDetoxActive, setIsDetoxActive] = useState(false);
  const [hasUnreadSocial, setHasUnreadSocial] = useState(false);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  const [showMockSimulationModal, setShowMockSimulationModal] = useState(false);
  const [showCompanionsModal, setShowCompanionsModal] = useState(false);
  const [currentSpotifyTrack, setCurrentSpotifyTrack] = useState<SpotifyTrack | null>(null);

  // Save on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch {
      // ignore
    }
  }, [gameState]);

  // Sync sound manager with state
  useEffect(() => {
    sounds.enabled = gameState.soundEnabled;
  }, [gameState.soundEnabled]);

  // Deep Link / OAuth Callback handler on app launch (for Android APK redirects)
  useEffect(() => {
    const handleUrlCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const code = searchParams.get('code') || hashParams.get('code');
        const error = searchParams.get('error') || hashParams.get('error');

        if (error) {
          triggerToast(`Spotify bağlantı hatası: ${error}`);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (code) {
          window.history.replaceState({}, document.title, window.location.pathname);
          const baseUrl = getBackendBaseUrl();
          triggerToast('🎧 Spotify kodu doğrulanıyor...');
          const exchangeRes = await fetch(`${baseUrl}/api/spotify/exchange-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          if (exchangeRes.ok) {
            const tokenData = await exchangeRes.json();
            localStorage.setItem('mezun_spotify_access_token', tokenData.access_token);
            if (tokenData.refresh_token) {
              localStorage.setItem('mezun_spotify_refresh_token', tokenData.refresh_token);
            }
            sounds.playSuccess();
            triggerToast('🎉 Spotify hesabın başarıyla bağlandı!');
          } else {
            triggerToast('Spotify bağlantısı tamamlanamadı.');
          }
        }
      } catch (err) {
        // ignore
      }
    };

    handleUrlCallback();
  }, []);

  // Active Spotify Background Tracker: continuously detects what's playing and automatically activates music buffs!
  const lastDetectedTrackKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const pollSpotifyCurrentTrack = async () => {
      const token = localStorage.getItem('mezun_spotify_access_token');
      if (!token) return;

      try {
        const baseUrl = getBackendBaseUrl();
        const res = await fetch(`${baseUrl}/api/spotify/current-track`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          // Token expired, clear invalid session
          localStorage.removeItem('mezun_spotify_access_token');
          return;
        }

        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && data.track) {
            const detected = detectGenreFromTrack(
              data.track.name,
              data.track.artist,
              data.track.albumName || '',
              data.track.artistGenres || []
            );

            const trackWithGenre: SpotifyTrack = {
              ...data.track,
              detectedGenre: detected,
            };

            setCurrentSpotifyTrack(trackWithGenre);

            // Automatically apply buff if track changed or active genre differs
            const trackKey = `${data.track.id}_${detected}`;
            if (lastDetectedTrackKeyRef.current !== trackKey) {
              lastDetectedTrackKeyRef.current = trackKey;

              setGameState(prev => {
                if (prev.activeMusicGenre !== detected) {
                  const buff = MUSIC_BUFFS[detected] || MUSIC_BUFFS.LO_FI;
                  sounds.playSuccess();
                  triggerToast(
                    `🎧 Spotify: "${data.track.name}" (${data.track.artist}) algılandı! [${buff.name}: ${buff.badge}] aktif!`
                  );

                  return {
                    ...prev,
                    activeMusicGenre: detected,
                  };
                }
                return prev;
              });
            }
          }
        }
      } catch {
        // Silently handle transient connection drops
      }
    };

    // Poll immediately on mount, then every 7 seconds
    pollSpotifyCurrentTrack();
    const interval = setInterval(pollSpotifyCurrentTrack, 7000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Retroactive Auto-Claim for existing/legacy unlocked achievements
  useEffect(() => {
    setGameState(prev => {
      let retroactiveMoney = 0;
      let retroactiveBp = 0;
      let hasRetroactive = false;
      const updatedAchievements = { ...(prev.achievements || {}) };

      ACHIEVEMENTS_LIST.forEach(ach => {
        const item = updatedAchievements[ach.id];
        if (item?.unlocked && !item?.claimed) {
          updatedAchievements[ach.id] = {
            ...item,
            claimed: true,
          };
          retroactiveMoney += ach.rewardMoney;
          retroactiveBp += ach.rewardBp;
          hasRetroactive = true;
        }
      });

      if (!hasRetroactive) return prev;

      return {
        ...prev,
        money: prev.money + retroactiveMoney,
        bp: prev.bp + retroactiveBp,
        achievements: updatedAchievements,
      };
    });
  }, []);

  // Periodic YouTube Teacher Posts to YKSGram (Every 35-45 seconds)
  useEffect(() => {
    const teacherPostInterval = setInterval(() => {
      setGameState(prev => {
        // Pick a random post from YouTube teachers pool that isn't already active
        const availablePosts = YOUTUBE_TEACHER_POSTS_POOL.filter(
          p => !prev.socialPosts.some(active => active.content === p.content)
        );

        if (availablePosts.length === 0) return prev;

        const chosenTemplate = availablePosts[Math.floor(Math.random() * availablePosts.length)];
        const newTeacherPost: SocialPost = {
          ...chosenTemplate,
          id: `post_teacher_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          timeAgo: 'Az önce',
          likes: chosenTemplate.likes + Math.floor(Math.random() * 15),
          commentsCount: chosenTemplate.commentsCount + Math.floor(Math.random() * 5),
          userLiked: false,
          userSaved: false,
          hasClaimedReward: false,
        };

        sounds.playSuccess();
        setHasUnreadSocial(true);
        setEventToast(`📢 YKSGram: ${newTeacherPost.authorName} yeni bir gönderi paylaştı!`);
        setTimeout(() => setEventToast(null), 5500);

        return {
          ...prev,
          socialPosts: [newTeacherPost, ...prev.socialPosts],
        };
      });
    }, 40000); // Trigger every 40 seconds

    return () => clearInterval(teacherPostInterval);
  }, []);

  // Check and unlock milestones / achievements
  useEffect(() => {
    const currentAchievements = { ...(gameState.achievements || {}) };
    let hasChanges = false;
    const newlyUnlockedList: string[] = [];
    let addedMoney = 0;
    let addedBp = 0;

    ACHIEVEMENTS_LIST.forEach(ach => {
      if (currentAchievements[ach.id]?.unlocked) return;

      let isMet = false;
      switch (ach.id) {
        case 'ach_questions_100':
          isMet = gameState.totalQuestionsSolved >= 100;
          break;
        case 'ach_questions_1000':
          isMet = gameState.totalQuestionsSolved >= 1000;
          break;
        case 'ach_questions_5000':
          isMet = gameState.totalQuestionsSolved >= 5000;
          break;
        case 'ach_day_10':
          isMet = gameState.day >= 10;
          break;
        case 'ach_day_30':
          isMet = gameState.day >= 30;
          break;
        case 'ach_day_50':
          isMet = gameState.day >= 50;
          break;
        case 'ach_first_exam':
          isMet = gameState.examHistory.length >= 1;
          break;
        case 'ach_exams_5':
          isMet = gameState.examHistory.length >= 5;
          break;
        case 'ach_tyt_90':
          isMet = gameState.currentTytEstimate >= 90;
          break;
        case 'ach_tyt_100':
          isMet = gameState.currentTytEstimate >= 100;
          break;
        case 'ach_coffee_10':
          isMet = (gameState.coffeeDrunkCount || 0) >= 10;
          break;
        case 'ach_breathing_3':
          isMet = (gameState.breathingCount || 0) >= 3;
          break;
        case 'ach_yahya_1':
          isMet = (gameState.yahyaEncounterCount || 0) >= 1;
          break;
        case 'ach_rank_top10k':
          isMet = gameState.currentRankEstimate <= 10000;
          break;
      }

      if (isMet) {
        currentAchievements[ach.id] = {
          unlocked: true,
          claimed: true,
          unlockedAtDay: gameState.day,
        };
        newlyUnlockedList.push(ach.title);
        addedMoney += ach.rewardMoney;
        addedBp += ach.rewardBp;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      sounds.playCoin();
      setEventToast(`🏆 Yeni Rozet Hakedildi: ${newlyUnlockedList.join(', ')}! (+${addedMoney}₺ & +${addedBp} BP hesabına eklendi)`);
      setTimeout(() => setEventToast(null), 6000);
      setGameState(prev => ({
        ...prev,
        money: prev.money + addedMoney,
        bp: prev.bp + addedBp,
        achievements: currentAchievements,
      }));
    }
  }, [
    gameState.totalQuestionsSolved,
    gameState.day,
    gameState.examHistory.length,
    gameState.currentTytEstimate,
    gameState.coffeeDrunkCount,
    gameState.breathingCount,
    gameState.yahyaEncounterCount,
    gameState.currentRankEstimate,
  ]);

  // Passive Tycoon Tick Loop (every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        // Calculate passive BP income from upgrades
        const headphoneLvl = prev.upgrades['up_noise_headphone'] || 0;
        const bookLvl = prev.upgrades['up_soru_bankasi'] || 0;
        const libraryLvl = prev.upgrades['up_kutuphane'] || 0;
        const passiveBp = headphoneLvl * 1.5 + bookLvl * 2.0 + libraryLvl * 3.0;

        let newBp = prev.bp + (passiveBp > 0 ? passiveBp : 0);

        // Check burnout and flow state triggers
        const genre = prev.activeMusicGenre || 'LO_FI';
        const isPopDance = genre === 'POP_DANCE' || genre === 'POP_ENERGY';
        const isBurnout = prev.stress >= 85;
        const isFlowState = isPopDance
          ? (prev.morale >= 55 && prev.stress <= 60)
          : (prev.morale >= 80 && prev.stress <= 40);

        // Passive stress recovery if very low activity
        let newStress = prev.stress;
        if (isDetoxActive && newStress > 10) {
          newStress = Math.max(0, newStress - 0.2);
        }

        return {
          ...prev,
          bp: newBp,
          isBurnout,
          isFlowState,
          stress: newStress,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isDetoxActive]);

  // Handle Advance Time (Morning -> Noon -> Afternoon -> Evening -> Night -> Morning)
  const handleAdvanceTime = () => {
    setGameState(prev => {
      const times: GameSaveState['timeOfDay'][] = ['SABAH', 'ÖĞLE', 'İKİNDİ', 'AKŞAM', 'GECE'];
      const currentIndex = times.indexOf(prev.timeOfDay);
      const isNextDay = currentIndex === times.length - 1;
      const nextTime = isNextDay ? 'SABAH' : times[currentIndex + 1];

      let newDay = prev.day;
      let newRemaining = prev.daysRemaining;
      let newStreak = prev.streakDays;
      let newMoney = prev.money;
      let newEnergy = prev.energy;

      if (isNextDay) {
        newDay += 1;
        newRemaining = Math.max(0, newRemaining - 1);
        newStreak += 1;
        // Daily allowance + library passive income
        const libraryLvl = prev.upgrades['up_kutuphane'] || 0;
        const dailyAllowance = 40 + libraryLvl * 50;
        newMoney += dailyAllowance;
        // Rest restores energy
        newEnergy = Math.min(100, newEnergy + 65);
        sounds.playSuccess();
      }

      // Music buffs on advance time
      let newMorale = prev.morale;
      const genre = prev.activeMusicGenre || 'LO_FI';
      if (genre === 'LO_FI') {
        newMorale = Math.min(100, newMorale + 4);
      } else if (genre === 'TURKISH_NOSTALGIA') {
        newMorale = Math.max(newMorale, prev.morale); // Protect morale
      }

      // 35% chance to trigger a random event on time change (Filter out Yahya events if disabled)
      if (Math.random() < 0.38 && !activeEvent) {
        const availableEvents = prev.disableYahyaEvents
          ? RANDOM_EVENTS.filter(e => !e.isYahyaHoca)
          : RANDOM_EVENTS;

        if (availableEvents.length > 0) {
          const yahyaEvents = availableEvents.filter(e => e.isYahyaHoca);
          
          let chosenEvent: RandomEvent;
          if (!prev.disableYahyaEvents && Math.random() < 0.60 && yahyaEvents.length > 0) {
            chosenEvent = yahyaEvents[Math.floor(Math.random() * yahyaEvents.length)];
          } else {
            chosenEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
          }
          setTimeout(() => setActiveEvent(chosenEvent), 350);
        }
      }

      // Check if YKS day has arrived
      if (newRemaining <= 0) {
        setTimeout(() => setShowFinalModal(true), 600);
      }

      return {
        ...prev,
        day: newDay,
        daysRemaining: newRemaining,
        timeOfDay: nextTime,
        streakDays: newStreak,
        money: newMoney,
        energy: newEnergy,
        morale: newMorale,
      };
    });
  };

  // Click Soru Çöz
  const handleSolveQuestion = (targetedSubjectId?: string) => {
    setGameState(prev => {
      if (prev.energy <= 5) return prev;

      const diff = prev.difficulty || 'BALANCED';
      const diffConfig = DIFFICULTY_CONFIGS[diff] || DIFFICULTY_CONFIGS.BALANCED;

      const genre = prev.activeMusicGenre || 'LO_FI';
      const isMetal = genre === 'METAL_ROCK' || genre === 'ROCK_TRAP';
      const isClassical = genre === 'CLASSICAL';
      const isLofi = genre === 'LO_FI';
      const isRapTrap = genre === 'RAP_TRAP';
      const isPopDance = genre === 'POP_DANCE' || genre === 'POP_ENERGY';
      const isPhonk = genre === 'PHONK_DRIFT';

      let musicBpMultiplier = 1.0;
      if (isMetal) musicBpMultiplier = 2.5;
      else if (isPhonk) musicBpMultiplier = 2.0;
      else if (isRapTrap) musicBpMultiplier = 1.6;
      else if (isPopDance && prev.isFlowState) musicBpMultiplier = 1.4;

      const chairLvl = prev.upgrades['up_desk_chair'] || 0;
      const energyMultiplier = isMetal ? 1.3 : 1.0;
      const energyCost = Math.max(1, (2 - chairLvl * 0.2) * energyMultiplier * diffConfig.energyCostMultiplier);
      const traitSpeed = prev.character.traitId === 'pomodoro_pro' ? 1.25 : 1.0;
      const flowMultiplier = prev.isFlowState ? 2.0 : 1.0;

      // Rap/Trap removes burnout penalty completely!
      const burnoutPenalty = (prev.isBurnout && !isRapTrap) ? 0.5 : 1.0;
      const gainedBp = 10 * traitSpeed * flowMultiplier * burnoutPenalty * musicBpMultiplier * diffConfig.studySpeedMultiplier;

      // Update subject masteries with realistic Diminishing Returns as mastery climbs
      const updatedSubjects = prev.subjects.map(sub => {
        if (!targetedSubjectId || sub.id === targetedSubjectId) {
          const isMath = sub.id === 'tyt_mat' || sub.id === 'ayt_mat' || sub.id === 'tyt_geo';
          const classicalBonus = (isClassical && isMath) ? 1.40 : 1.0;
          // Diminishing returns: It gets harder to gain mastery as you reach perfection (above 60% and 80%)
          const diminishingFactor = sub.mastery > 85 ? 0.35 : (sub.mastery > 60 ? 0.65 : 1.0);
          const addMastery = Math.min(100, sub.mastery + (0.16 * burnoutPenalty * classicalBonus * diminishingFactor * diffConfig.studySpeedMultiplier));
          const addQuestions = Math.round((isMetal ? 8 : (isPhonk || isRapTrap ? 6 : 4)) * (diff === 'SPEEDRUN' ? 2 : 1));
          return {
            ...sub,
            mastery: Math.min(100, addMastery),
            completedQuestions: sub.completedQuestions + addQuestions,
          };
        }
        return sub;
      });

      // Stress increment: Metal creates rage armor (0 stress increase!), Lo-Fi cuts it by 75%
      const calmMind = prev.character.traitId === 'calm_mind' ? 0.7 : 1.0;
      let stressAdd = 1.0 * calmMind * diffConfig.stressMultiplier;
      if (isMetal) stressAdd = 0;
      else if (isLofi) stressAdd *= 0.25;

      // Small chance to trigger random event (Respect disableYahyaEvents)
      if (Math.random() < 0.05 && !activeEvent) {
        const available = prev.disableYahyaEvents
          ? RANDOM_EVENTS.filter(e => !e.isYahyaHoca)
          : RANDOM_EVENTS;
        if (available.length > 0) {
          const randIndex = Math.floor(Math.random() * available.length);
          setTimeout(() => setActiveEvent(available[randIndex]), 300);
        }
      }

      return {
        ...prev,
        energy: Math.max(0, prev.energy - energyCost),
        stress: Math.min(100, prev.stress + stressAdd),
        bp: prev.bp + gainedBp,
        totalQuestionsSolved: prev.totalQuestionsSolved + (isMetal ? 10 : (isPhonk || isRapTrap ? 8 : 5)),
        subjects: updatedSubjects,
      };
    });
  };

  // Pomodoro 25 Dk Focus Study Sprint
  const handleStartPomodoro = () => {
    if (gameState.energy < 15 || isStudying) return;
    setIsStudying(true);
    setPomodoroProgress(0);

    const diff = gameState.difficulty || 'BALANCED';
    const diffConfig = DIFFICULTY_CONFIGS[diff] || DIFFICULTY_CONFIGS.BALANCED;

    const genre = gameState.activeMusicGenre || 'LO_FI';
    const isPhonk = genre === 'PHONK_DRIFT';
    // Speedrun and Phonk accelerate timer
    const baseStepTime = isPhonk ? 60 : 100;
    const stepTime = diff === 'SPEEDRUN' ? Math.round(baseStepTime * 0.6) : baseStepTime;
    const totalSteps = 25;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setPomodoroProgress((currentStep / totalSteps) * 100);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setIsStudying(false);
        sounds.playSuccess();

        setGameState(prev => {
          const g = prev.activeMusicGenre || 'LO_FI';
          const flowMultiplier = prev.isFlowState ? 2.0 : 1.0;
          const metalBonus = (g === 'METAL_ROCK' || g === 'ROCK_TRAP') ? 1.8 : 1.0;
          const bpGain = 85 * flowMultiplier * metalBonus * diffConfig.studySpeedMultiplier;

          const updatedSubjects = prev.subjects.map(s => {
            const isMath = s.id === 'tyt_mat' || s.id === 'ayt_mat' || s.id === 'tyt_geo';
            const bonus = (g === 'CLASSICAL' && isMath) ? 1.4 : 1.0;
            const diminishingFactor = s.mastery > 85 ? 0.4 : (s.mastery > 60 ? 0.7 : 1.0);
            return {
              ...s,
              mastery: Math.min(100, s.mastery + (1.2 * bonus * diminishingFactor * diffConfig.studySpeedMultiplier)),
              completedQuestions: s.completedQuestions + 25,
            };
          });

          return {
            ...prev,
            energy: Math.max(0, prev.energy - (g === 'METAL_ROCK' ? 18 : 14) * diffConfig.energyCostMultiplier),
            stress: Math.min(100, prev.stress + (g === 'LO_FI' ? 1 : 5) * diffConfig.stressMultiplier),
            morale: Math.min(100, prev.morale + (g === 'LO_FI' ? 12 : 7)),
            bp: prev.bp + bpGain,
            totalQuestionsSolved: prev.totalQuestionsSolved + 25,
            subjects: updatedSubjects,
          };
        });
      }
    }, stepTime);
  };

  // Drink Coffee Action
  const handleDrinkCoffee = () => {
    setGameState(prev => {
      const isJazzAcoustic = prev.activeMusicGenre === 'JAZZ_ACOUSTIC';
      const coffeeBonus = prev.character.traitId === 'coffee_addict' ? 1.4 : 1.0;
      const coffeeMakerLvl = prev.upgrades['up_coffee_maker'] || 0;
      const extraEnergy = isJazzAcoustic ? 12 : 0;
      const energyGain = (12 + coffeeMakerLvl * 6 + extraEnergy) * coffeeBonus;

      return {
        ...prev,
        energy: Math.min(100, prev.energy + energyGain),
        stress: Math.max(0, prev.stress - (isJazzAcoustic ? 12 : 5)),
        morale: Math.min(100, prev.morale + (isJazzAcoustic ? 8 : 4)),
        isBurnout: isJazzAcoustic ? false : prev.isBurnout,
        coffeeDrunkCount: (prev.coffeeDrunkCount || 0) + 1,
      };
    });
  };

  // Take Practice Exam (Deneme Sınavı)
  const handleTakeExam = (
    examType: 'BRANS_TURKCE' | 'BRANS_MAT' | 'TYT_FULL' | 'AYT_FULL',
    tactic: 'TURLAMA' | 'HIZLI' | 'DENGELI'
  ) => {
    setIsTakingExam(true);

    setTimeout(() => {
      setIsTakingExam(false);

      setGameState(prev => {
        // Calculate scores from subjects mastery + upgrades + tactic
        const cikmisLvl = prev.upgrades['up_cikmis_sorular'] || 0;
        const denemeArsivLvl = prev.upgrades['up_deneme_arsivi'] || 0;
        const coachLvl = prev.upgrades['up_koc'] || 0;
        const tacticBonus = prev.character.traitId === 'exam_tactician' ? 2.5 : 0;

        let tacticNetModifier = 0;
        let stressRisk = 0;
        if (tactic === 'TURLAMA') {
          tacticNetModifier = 1.5;
          stressRisk = -4;
        } else if (tactic === 'HIZLI') {
          tacticNetModifier = (Math.random() * 6) - 1.5; // High variance
          stressRisk = 8;
        }

        const masteryFactor = prev.subjects.reduce((acc, s) => acc + s.mastery, 0) / prev.subjects.length;
        // Challenging curve: To reach 105+ TYT or 75+ AYT, player needs 80%+ subject mastery and high level upgrades!
        const basePerformance = 48 + (masteryFactor * 0.62) + (cikmisLvl * 1.2) + (denemeArsivLvl * 1.5) + tacticBonus + tacticNetModifier;

        let newRecord: ExamRecord;
        let newTytEstimate = prev.currentTytEstimate;
        let newAytEstimate = prev.currentAytEstimate;

        if (examType === 'TYT_FULL') {
          const totalTyt = Math.min(120, Math.max(38, basePerformance + (Math.random() * 3.5 - 1.75)));
          const turkce = Math.min(40, totalTyt * 0.33);
          const mat = Math.min(40, totalTyt * 0.32);
          const fen = Math.min(20, totalTyt * 0.18);
          const sosyal = Math.min(20, totalTyt * 0.17);

          newTytEstimate = Math.max(newTytEstimate, totalTyt);

          // Calculate estimated national rank with realistic competition curves
          // 112+ net -> <500, 105 net -> ~2,500, 95 net -> ~18,000, 80 net -> ~70,000, 60 net -> ~150,000
          const rank = Math.round(Math.max(90, 520000 * Math.exp(-0.061 * (totalTyt - 35))));

          newRecord = {
            id: `ex_${Date.now()}`,
            name: 'Özdebir Türkiye Geneli TYT',
            dateStr: `${prev.day}. Gün Denemesi`,
            day: prev.day,
            type: 'KURUMSAL_TYT',
            tytScore: {
              turkce: Number(turkce.toFixed(1)),
              matematik: Number(mat.toFixed(1)),
              fen: Number(fen.toFixed(1)),
              sosyal: Number(sosyal.toFixed(1)),
              total: Number(totalTyt.toFixed(1)),
            },
            estimatedRank: rank,
            isRecordScore: totalTyt > prev.currentTytEstimate,
          };
        } else if (examType === 'AYT_FULL') {
          // AYT is notoriously difficult; requires solid high-tier knowledge
          const totalAyt = Math.min(80, Math.max(18, (basePerformance * 0.64) + (Math.random() * 3 - 1.5)));
          newAytEstimate = Math.max(newAytEstimate, totalAyt);

          const rank = Math.round(Math.max(75, 420000 * Math.exp(-0.069 * (totalAyt - 18))));

          newRecord = {
            id: `ex_${Date.now()}`,
            name: 'Bilgi Sarmal AYT Alan Provası',
            dateStr: `${prev.day}. Gün Denemesi`,
            day: prev.day,
            type: 'KURUMSAL_AYT',
            aytScore: {
              ders1: Number((totalAyt * 0.52).toFixed(1)),
              ders2: Number((totalAyt * 0.48).toFixed(1)),
              total: Number(totalAyt.toFixed(1)),
            },
            estimatedRank: rank,
            isRecordScore: totalAyt > prev.currentAytEstimate,
          };
        } else {
          // Branş denemesi
          const isTurkce = examType === 'BRANS_TURKCE';
          const net = Math.min(40, Math.max(12, (basePerformance * 0.28) + (Math.random() * 2.5 - 1.25)));
          const rank = Math.round(Math.max(500, prev.currentRankEstimate - (Math.random() * 600 + 150)));

          newRecord = {
            id: `ex_${Date.now()}`,
            name: isTurkce ? 'TYT Türkçe Hız Denemesi' : 'TYT Matematik Hız Denemesi',
            dateStr: `${prev.day}. Gün Branş`,
            day: prev.day,
            type: 'BRANS',
            tytScore: {
              turkce: isTurkce ? net : 25,
              matematik: !isTurkce ? net : 22,
              fen: 12,
              sosyal: 14,
              total: isTurkce ? 25 + 12 + 14 + net : 22 + 12 + 14 + net,
            },
            estimatedRank: rank,
            isRecordScore: false,
          };
        }

        const delta = Math.max(0, prev.currentRankEstimate - newRecord.estimatedRank);
        setRankDelta(delta);
        setExamResult(newRecord);
        sounds.playSuccess();

        // New rank estimate is updated
        const updatedRank = Math.min(prev.currentRankEstimate, newRecord.estimatedRank);

        return {
          ...prev,
          energy: Math.max(0, prev.energy - (examType === 'TYT_FULL' ? 25 : examType === 'AYT_FULL' ? 30 : 12)),
          bp: Math.max(0, prev.bp - (examType === 'TYT_FULL' ? 40 : examType === 'AYT_FULL' ? 50 : 15)),
          stress: Math.min(100, Math.max(0, prev.stress + stressRisk + 6)),
          morale: Math.min(100, prev.morale + 10),
          currentTytEstimate: newTytEstimate,
          currentAytEstimate: newAytEstimate,
          currentRankEstimate: updatedRank,
          examHistory: [newRecord, ...prev.examHistory],
        };
      });
    }, 1200);
  };

  // Handle Mock Exam Simulation Complete
  const handleFinishMockSimulation = (finalRecord: ExamRecord) => {
    setShowMockSimulationModal(false);

    setGameState(prev => {
      const delta = Math.max(0, prev.currentRankEstimate - finalRecord.estimatedRank);
      setRankDelta(delta);
      setExamResult(finalRecord);
      sounds.playSuccess();

      const newTyt = Math.max(prev.currentTytEstimate, finalRecord.tytScore?.total || 0);
      const newRank = Math.min(prev.currentRankEstimate, finalRecord.estimatedRank);
      const bonusBp = finalRecord.simulationDetails?.enduranceBonus || 100;

      return {
        ...prev,
        bp: prev.bp + bonusBp,
        morale: Math.min(100, prev.morale + 18),
        currentTytEstimate: newTyt,
        currentRankEstimate: newRank,
        examHistory: [finalRecord, ...prev.examHistory],
      };
    });

    setEventToast('🔥 3\'lü Sınav Simülasyonu başarıyla tamamlandı! Yüksek dayanıklılık bonusu kazandın.');
    setTimeout(() => setEventToast(null), 5000);
  };

  // Buy Tycoon Upgrade
  const handleBuyUpgrade = (upgradeId: string, cost: number) => {
    setGameState(prev => {
      if (prev.money < cost) return prev;
      const currentLevel = prev.upgrades[upgradeId] || 0;
      return {
        ...prev,
        money: prev.money - cost,
        upgrades: {
          ...prev.upgrades,
          [upgradeId]: currentLevel + 1,
        },
      };
    });
  };

  // Relaxation action
  const handleRelaxAction = (actionType: 'WALK' | 'CAKE_TEA' | 'MUSIC' | 'NAP' | 'FRIEND_CALL') => {
    setGameState(prev => {
      let dStress = -12;
      let dEnergy = 10;
      let dMorale = 10;

      switch (actionType) {
        case 'CAKE_TEA':
          dStress = -15;
          dEnergy = 20;
          dMorale = 15;
          break;
        case 'WALK':
          dStress = -18;
          dEnergy = -5;
          dMorale = 12;
          break;
        case 'MUSIC':
          dStress = -12;
          dEnergy = 5;
          dMorale = 10;
          break;
        case 'NAP':
          dStress = -14;
          dEnergy = 30;
          dMorale = 8;
          break;
        case 'FRIEND_CALL':
          dStress = -22;
          dEnergy = -5;
          dMorale = 20;
          break;
      }

      return {
        ...prev,
        stress: Math.max(0, prev.stress + dStress),
        energy: Math.min(100, Math.max(0, prev.energy + dEnergy)),
        morale: Math.min(100, prev.morale + dMorale),
        isBurnout: false,
      };
    });
  };

  // 4-7-8 Breathing mini-game completion
  const handleCompleteBreathing = () => {
    setGameState(prev => ({
      ...prev,
      stress: Math.max(0, prev.stress - 25),
      morale: Math.min(100, prev.morale + 15),
      breathingCount: (prev.breathingCount || 0) + 1,
      isBurnout: false,
    }));
  };

  // Like Social Post
  const handleLikePost = (postId: string) => {
    setGameState(prev => {
      const posts = prev.socialPosts.map(p => {
        if (p.id === postId) {
          const nextLiked = !p.userLiked;
          return {
            ...p,
            userLiked: nextLiked,
            likes: nextLiked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      });

      const targetPost = prev.socialPosts.find(p => p.id === postId);
      let stressChange = 0;
      let moraleChange = 0;
      if (targetPost && !targetPost.userLiked) {
        stressChange = targetPost.stressDelta || 0;
        moraleChange = targetPost.moraleDelta || 0;
      }

      return {
        ...prev,
        socialPosts: posts,
        stress: Math.min(100, Math.max(0, prev.stress + stressChange)),
        morale: Math.min(100, Math.max(0, prev.morale + moraleChange)),
      };
    });
  };

  // Add custom player social post (with optional image)
  const handleAddPost = (content: string, category: 'studygram' | 'meme' | 'advice', imageUrl?: string) => {
    const isTurkishNostalgia = gameState.activeMusicGenre === 'TURKISH_NOSTALGIA';
    const likesCount = isTurkishNostalgia ? 42 : 18;
    const moraleBoost = isTurkishNostalgia ? 28 : 18;

    const newPost: SocialPost = {
      id: `post_${Date.now()}`,
      authorId: 'user_player',
      authorName: gameState.character.name,
      authorHandle: `@${gameState.character.name.toLowerCase().replace(/\s+/g, '_')}_yks`,
      avatarIcon: 'GraduationCap',
      avatarBg: 'bg-pink-600',
      avatarImage: gameState.character.avatarImage,
      imageUrl,
      authorBadge: 'SEN',
      content,
      likes: likesCount,
      commentsCount: 1,
      userLiked: true,
      timeAgo: 'Az önce',
      impactType: 'MORALE_UP',
      stressDelta: -5,
      moraleDelta: moraleBoost,
      postCategory: category,
      comments: [
        {
          id: `c_auto_${Date.now()}`,
          authorName: 'Berat',
          authorHandle: '@berat_05x_donanim',
          authorBadge: 'DERECE',
          authorAvatar: SOCIAL_AVATARS.char_berat,
          content: 'Harika... odak... tebrik... ederim... badem... ikramım... her... zaman... geçerli... 🥜⚡',
          timeAgo: 'Az önce',
          likes: 5,
        },
      ],
    };

    // Chance to gain a new follower when posting
    const gainedFollowers = Math.floor(Math.random() * 3) + 1;

    setGameState(prev => ({
      ...prev,
      socialPosts: [newPost, ...prev.socialPosts],
      socialFollowersCount: (prev.socialFollowersCount || 142) + gainedFollowers,
      morale: Math.min(100, prev.morale + moraleBoost),
      stress: Math.max(0, prev.stress - 5),
    }));

    triggerToast(`📸 Gönderin YKSGram'da paylaşıldı! +${gainedFollowers} yeni mezun seni takip etmeye başladı.`);
  };

  // Add Comment to Post with realistic auto-reply from author or friends
  const handleAddCommentToPost = (postId: string, commentText: string) => {
    const targetPost = gameState.socialPosts.find(p => p.id === postId);

    const userComment: SocialComment = {
      id: `comm_${Date.now()}`,
      authorName: gameState.character.name,
      authorHandle: `@${gameState.character.name.toLowerCase().replace(/\s+/g, '_')}`,
      authorBadge: 'SEN',
      authorAvatar: gameState.character.avatarImage,
      content: commentText,
      timeAgo: 'Şimdi',
      likes: 1,
      userLiked: true,
    };

    // Realistic reply responses
    let autoReply: SocialComment | null = null;
    if (targetPost) {
      if (targetPost.authorId === 'eyup_b' || targetPost.authorName.includes('Eyüp')) {
        autoReply = {
          id: `reply_${Date.now() + 1}`,
          authorName: 'Eyüp B.',
          authorHandle: '@eyup_b_mat',
          authorBadge: 'HOCA',
          authorAvatar: SOCIAL_AVATARS.eyup_b,
          content: 'Harika bir soru yaklaşımı! İşte benim mezunum, türevin mantığını kavramışsın.',
          timeAgo: '1 dk önce',
          likes: 12,
        };
      } else if (targetPost.authorId === 'mert_hoca' || targetPost.authorName.includes('Mert')) {
        autoReply = {
          id: `reply_${Date.now() + 1}`,
          authorName: 'Mert Hoca',
          authorHandle: '@merthoca_mat',
          authorBadge: 'HOCA',
          authorAvatar: SOCIAL_AVATARS.mert_hoca,
          content: 'Adamsın! Aynen böyle devam, o masa sana üniversite kazandıracak!',
          timeAgo: '1 dk önce',
          likes: 16,
        };
      } else if (targetPost.authorId === 'char_berat' || targetPost.authorName.includes('Berat')) {
        autoReply = {
          id: `reply_${Date.now() + 1}`,
          authorName: 'Berat',
          authorHandle: '@berat_05x_donanim',
          authorBadge: 'DERECE',
          authorAvatar: SOCIAL_AVATARS.char_berat,
          content: 'Haklısın... kütüphaneye... gelirsen... promptun... en... optimize... halini... vereyim...',
          timeAgo: '1 dk önce',
          likes: 8,
        };
      } else if (targetPost.authorId === 'char_zehra' || targetPost.authorName.includes('Zehra')) {
        autoReply = {
          id: `reply_${Date.now() + 1}`,
          authorName: 'Zehra Abla',
          authorHandle: '@zehra_abla_favori',
          authorBadge: 'HOCA',
          authorAvatar: SOCIAL_AVATARS.char_zehra,
          content: 'Canım evladım benim, çayını doldurayım hemen zihnin açılsın 🌸☕',
          timeAgo: '1 dk önce',
          likes: 22,
        };
      }
    }

    setGameState(prev => ({
      ...prev,
      morale: Math.min(100, prev.morale + 4),
      stress: Math.max(0, prev.stress - 2),
      socialPosts: prev.socialPosts.map(p => {
        if (p.id === postId) {
          const replies = autoReply ? [autoReply, userComment] : [userComment];
          const updatedComments = [...replies, ...(p.comments || [])];
          return {
            ...p,
            comments: updatedComments,
            commentsCount: updatedComments.length,
          };
        }
        return p;
      }),
    }));
  };

  // Follow / Unfollow User / Teacher / Companion
  const handleToggleFollow = (authorId: string, authorName: string) => {
    setGameState(prev => {
      const currentFollowing = prev.socialFollowing || ['eyup_b', 'mert_hoca', 'char_zehra', 'char_berat'];
      const alreadyFollowing = currentFollowing.includes(authorId);

      let nextFollowing: string[];
      let message = '';
      if (alreadyFollowing) {
        nextFollowing = currentFollowing.filter(id => id !== authorId);
        message = `Takipten çıkıldı: ${authorName}`;
      } else {
        nextFollowing = [...currentFollowing, authorId];
        message = `✓ Takip ediliyor: ${authorName}. Artık gönderileri ve hikayeleri akışında en üstte!`;
      }

      triggerToast(message);

      return {
        ...prev,
        socialFollowing: nextFollowing,
      };
    });
  };

  // Add new Story from player
  const handleAddStory = (textOverlay: string, storyTag: string, imageUrl?: string) => {
    const newStory: SocialStory = {
      id: `story_${Date.now()}`,
      authorId: 'user_player',
      authorName: gameState.character.name,
      authorHandle: `@${gameState.character.name.toLowerCase().replace(/\s+/g, '_')}`,
      authorBadge: 'SEN',
      avatarIcon: 'GraduationCap',
      avatarImage: gameState.character.avatarImage,
      imageUrl: imageUrl || gameState.character.avatarImage,
      textOverlay,
      storyTag,
      timeAgo: 'Az önce',
      likesCount: 14,
      userLiked: true,
    };

    setGameState(prev => ({
      ...prev,
      socialStories: [newStory, ...(prev.socialStories || [])],
      morale: Math.min(100, prev.morale + 12),
      stress: Math.max(0, prev.stress - 4),
    }));

    triggerToast('✨ Hikayen 24 saatliğine YKSGram akışında yayınlandı!');
  };

  // Like a Story
  const handleLikeStory = (storyId: string) => {
    setGameState(prev => ({
      ...prev,
      morale: Math.min(100, prev.morale + 2),
      socialStories: (prev.socialStories || []).map(s => {
        if (s.id === storyId) {
          const nextLiked = !s.userLiked;
          return {
            ...s,
            userLiked: nextLiked,
            likesCount: (s.likesCount || 0) + (nextLiked ? 1 : -1),
          };
        }
        return s;
      }),
    }));
  };

  // Vote on Post Poll
  const handleVotePoll = (postId: string, optionId: string) => {
    setGameState(prev => ({
      ...prev,
      morale: Math.min(100, prev.morale + 4),
      socialPosts: prev.socialPosts.map(p => {
        if (p.id === postId && p.poll) {
          if (p.poll.userVotedOptionId) return p; // already voted
          const updatedOptions = p.poll.options.map(opt =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          );
          return {
            ...p,
            poll: {
              ...p.poll,
              options: updatedOptions,
              userVotedOptionId: optionId,
            },
          };
        }
        return p;
      }),
    }));
  };

  // Claim Teacher BP Bonus
  const handleClaimPostReward = (postId: string) => {
    setGameState(prev => {
      const post = prev.socialPosts.find(p => p.id === postId);
      if (!post || !post.bpReward || post.hasClaimedReward) return prev;

      sounds.playCoin();
      setEventToast(`🎁 Hoca Taktik Bonusu: +${post.bpReward} BP hesabına eklendi!`);
      setTimeout(() => setEventToast(null), 4500);

      return {
        ...prev,
        bp: prev.bp + post.bpReward,
        morale: Math.min(100, prev.morale + 6),
        socialPosts: prev.socialPosts.map(p =>
          p.id === postId ? { ...p, hasClaimedReward: true } : p
        ),
      };
    });
  };

  // Toggle Save Post Bookmark
  const handleToggleSavePost = (postId: string) => {
    setGameState(prev => ({
      ...prev,
      socialPosts: prev.socialPosts.map(p =>
        p.id === postId ? { ...p, userSaved: !p.userSaved } : p
      ),
    }));
  };

  // Select music genre and buff
  const handleSelectMusicGenre = (genre: MusicGenre, customTrack?: SpotifyTrack) => {
    setGameState(prev => ({
      ...prev,
      activeMusicGenre: genre,
    }));
    if (customTrack !== undefined) {
      setCurrentSpotifyTrack(customTrack);
    }
    const buff = MUSIC_BUFFS[genre];
    setEventToast(`🎵 Müzik Avantajı Aktif: ${buff.name} (${buff.badge}) - ${buff.bonusSummary}`);
    setTimeout(() => setEventToast(null), 5000);
  };

  // Handle Daily Motivation morale boost
  const handleBoostMorale = (amount: number) => {
    setGameState(prev => ({
      ...prev,
      morale: Math.min(100, prev.morale + amount),
      stress: Math.max(0, prev.stress - Math.floor(amount / 2)),
    }));
  };

  // Random event choice resolution
  const handleResolveEventChoice = (choiceIndex: number) => {
    if (!activeEvent) return;
    const choice = activeEvent.choices[choiceIndex];
    if (!choice) return;

    const isYahya = !!activeEvent.isYahyaHoca;

    sounds.playTap();
    if (choice.outcome.message) {
      triggerToast(choice.outcome.message);
    }

    setGameState(prev => {
      let updatedSubjects = prev.subjects;
      if (choice.outcome.mathMasteryBonus) {
        const bonus = choice.outcome.mathMasteryBonus;
        updatedSubjects = prev.subjects.map(s => {
          if (s.id === 'tyt_mat' || s.id === 'ayt_mat') {
            return {
              ...s,
              mastery: Math.min(100, s.mastery + bonus),
              completedQuestions: s.completedQuestions + 25,
            };
          }
          return s;
        });
      }

      const newTyt = prev.currentTytEstimate + (choice.outcome.tytNetBonus || 0);
      const newAyt = prev.currentAytEstimate + (choice.outcome.aytNetBonus || 0);
      let newRank = prev.currentRankEstimate;
      if (choice.outcome.aytNetBonus || choice.outcome.tytNetBonus) {
        newRank = Math.round(Math.max(120, prev.currentRankEstimate * 0.94));
      }

      return {
        ...prev,
        energy: Math.min(100, Math.max(0, prev.energy + (choice.outcome.energy || 0))),
        stress: Math.min(100, Math.max(0, prev.stress + (choice.outcome.stress || 0))),
        morale: Math.min(100, Math.max(0, prev.morale + (choice.outcome.morale || 0))),
        money: Math.max(0, prev.money + (choice.outcome.money || 0)),
        bp: Math.max(0, prev.bp + (choice.outcome.bp || 0)),
        yahyaEncounterCount: (prev.yahyaEncounterCount || 0) + (isYahya ? 1 : 0),
        subjects: updatedSubjects,
        currentTytEstimate: newTyt,
        currentAytEstimate: newAyt,
        currentRankEstimate: newRank,
      };
    });

    setActiveEvent(null);
  };

  // Companion Characters Action Handler (Zehra Abla & Temizlik Ekibi + Kütüphane Arkadaşları)
  const handlePerformCompanionAction = (
    characterId: string,
    actionId: string,
    outcome: CharacterInteraction['actions'][0]['outcome'],
    energyCost: number,
    moneyCost: number
  ) => {
    setGameState(prev => {
      const rels = { ...(prev.characterRelationships || {}) };
      const currentLevel = rels[characterId] ?? (characterId === 'char_zehra' ? 50 : 25);
      rels[characterId] = Math.min(100, currentLevel + outcome.relationshipGain);

      let updatedSubjects = prev.subjects;
      if (outcome.mathBonus) {
        updatedSubjects = updatedSubjects.map(s => {
          if (s.id === 'ayt_mat' || s.id === 'tyt_mat' || s.id === 'tyt_geo') {
            return { ...s, mastery: Math.min(100, s.mastery + outcome.mathBonus!) };
          }
          return s;
        });
      }

      if (outcome.turkceBonus) {
        updatedSubjects = updatedSubjects.map(s => {
          if (s.id === 'tyt_turkce') {
            return { ...s, mastery: Math.min(100, s.mastery + outcome.turkceBonus!) };
          }
          return s;
        });
      }

      if (outcome.fenBonus) {
        updatedSubjects = updatedSubjects.map(s => {
          if (s.id === 'tyt_fen' || s.id === 'ayt_fizik' || s.id === 'ayt_kimya' || s.id === 'ayt_biyo') {
            return { ...s, mastery: Math.min(100, s.mastery + outcome.fenBonus!) };
          }
          return s;
        });
      }

      if (outcome.sosyalBonus) {
        updatedSubjects = updatedSubjects.map(s => {
          if (s.id === 'tyt_sosyal' || s.id === 'ayt_tarih') {
            return { ...s, mastery: Math.min(100, s.mastery + outcome.sosyalBonus!) };
          }
          return s;
        });
      }

      const newEnergy = Math.min(100, Math.max(0, prev.energy - energyCost + (outcome.energy || 0)));
      const newMoney = Math.max(0, prev.money - moneyCost + (outcome.money || 0));
      const newStress = Math.min(100, Math.max(0, prev.stress + (outcome.stress || 0)));
      const newMorale = Math.min(100, Math.max(0, prev.morale + (outcome.morale || 0)));
      const newBp = Math.max(0, prev.bp + (outcome.bp || 0));

      return {
        ...prev,
        energy: newEnergy,
        money: newMoney,
        stress: newStress,
        morale: newMorale,
        bp: newBp,
        subjects: updatedSubjects,
        characterRelationships: rels,
      };
    });

    if (outcome.message) {
      triggerToast(outcome.message);
    }
  };

  // Claim achievement reward
  const handleClaimAchievementReward = (achievementId: string) => {
    const ach = ACHIEVEMENTS_LIST.find(a => a.id === achievementId);
    if (!ach) return;

    setGameState(prev => {
      const current = prev.achievements?.[achievementId];
      if (!current?.unlocked || current.claimed) return prev;

      sounds.playCoin();
      triggerToast(`🎁 Rozet Ödülü Alındı: +${ach.rewardMoney}₺ Harçlık ve +${ach.rewardBp} BP!`);

      return {
        ...prev,
        money: prev.money + ach.rewardMoney,
        bp: prev.bp + ach.rewardBp,
        achievements: {
          ...prev.achievements,
          [achievementId]: {
            ...current,
            claimed: true,
          },
        },
      };
    });
  };

  // Target university selection
  const handleSelectGoal = (goal: UniversityGoal) => {
    setGameState(prev => ({
      ...prev,
      targetGoal: goal,
    }));
  };

  // Character customization
  const handleUpdateCharacter = (updated: Partial<CharacterCustomization>) => {
    setGameState(prev => ({
      ...prev,
      character: {
        ...prev.character,
        ...updated,
      },
    }));
  };

  // Reset Game
  const handleResetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(INITIAL_GAME_STATE);
    setShowFinalModal(false);
  };

  // Direct Yahya Hoca interaction trigger
  const handleTriggerYahyaEvent = () => {
    if (gameState.disableYahyaEvents) return;
    const yahyaEvents = RANDOM_EVENTS.filter(e => e.isYahyaHoca);
    if (yahyaEvents.length > 0) {
      const randomYahya = yahyaEvents[Math.floor(Math.random() * yahyaEvents.length)];
      setActiveEvent(randomYahya);
    }
  };

  // Toggle Yahya Hoca events ignore/mute setting
  const handleToggleIgnoreYahya = (ignored: boolean) => {
    sounds.playTap();
    setGameState(prev => ({
      ...prev,
      disableYahyaEvents: ignored,
    }));
    if (ignored) {
      setActiveEvent(null);
      triggerToast('🔇 Yahya Hoca olayları görmezden gelindi. Artık karşınıza çıkmayacak.');
    } else {
      triggerToast('🔔 Yahya Hoca olayları tekrar aktif edildi.');
    }
  };

  // Change Game Difficulty
  const handleSetDifficulty = (newDifficulty: GameDifficulty) => {
    sounds.playSuccess();
    setGameState(prev => ({
      ...prev,
      difficulty: newDifficulty,
    }));
    const cfg = DIFFICULTY_CONFIGS[newDifficulty];
    triggerToast(`⚙️ Oyun Zorluğu Güncellendi: ${cfg.name} (${cfg.badge}) - ${cfg.tagline}`);
  };

  // Change Theme Mode (Dark, Light, System)
  const handleThemeModeChange = (newMode: ColorThemeMode) => {
    setGameState(prev => ({
      ...prev,
      colorTheme: newMode,
    }));
    triggerToast(
      `🎨 Tema Değiştirildi: ${
        newMode === 'DARK'
          ? '🌙 Karanlık Mod'
          : newMode === 'LIGHT'
          ? '☀️ Aydınlık Mod'
          : '💻 Sistem Varsayılanı'
      }`
    );
  };

  return (
    <ThemeProvider
      currentGenre={gameState.activeMusicGenre || 'LO_FI'}
      colorTheme={gameState.colorTheme || 'DARK'}
      onThemeChange={handleThemeModeChange}
    >
      <MobileFrame>
        {/* Top HUD Status Bar */}
      <TopStatusBar
        state={gameState}
        onToggleSound={() => {
          setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
        }}
        onAdvanceTime={handleAdvanceTime}
        onThemeModeChange={handleThemeModeChange}
      />

      {/* Event Outcome Toast Notification (Sarı Aksiyon Bildirim Kutucuğu - 15 Saniye) */}
      {eventToast && (
        <div className="mx-3 my-1.5 p-3 rounded-xl bg-amber-950/95 border border-amber-500/60 text-xs text-amber-200 flex flex-col gap-2 shadow-xl animate-in slide-in-from-top duration-300 z-30 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <span className="text-lg leading-none shrink-0 animate-bounce">📢</span>
              <span className="leading-relaxed font-medium text-amber-100">{eventToast}</span>
            </div>
            <button
              onClick={() => {
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                setEventToast(null);
              }}
              title="Bildirimi Kapat"
              className="text-amber-400 hover:text-white font-bold text-xs shrink-0 p-1 rounded-md hover:bg-amber-900/60 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
          {/* 15 Saniyelik İlerleme Çubuğu */}
          <div className="w-full bg-amber-900/40 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-200 rounded-full"
              style={{
                animation: 'toastCountdown 15s linear forwards',
              }}
            />
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 p-3 overflow-y-auto">
        {activeTab === 'ROOM' && (
          <StudyRoomView
            state={gameState}
            onSolveQuestion={handleSolveQuestion}
            onStartPomodoro={handleStartPomodoro}
            onDrinkCoffee={handleDrinkCoffee}
            onSubjectSelect={subId => handleSolveQuestion(subId)}
            onOpenExams={() => setActiveTab('EXAMS')}
            onOpenAchievements={() => setActiveTab('GOAL')}
            onOpenSpotify={() => setShowSpotifyModal(true)}
            onOpenSettings={() => setActiveTab('GOAL')}
            onOpenCompanions={() => setShowCompanionsModal(true)}
            onTriggerYahyaEvent={handleTriggerYahyaEvent}
            onToggleIgnoreYahya={handleToggleIgnoreYahya}
            onBoostMorale={handleBoostMorale}
            activeMusicGenre={gameState.activeMusicGenre || 'LO_FI'}
            currentSpotifyTrack={currentSpotifyTrack}
            isStudying={isStudying}
            pomodoroProgress={pomodoroProgress}
          />
        )}

        {activeTab === 'EXAMS' && (
          <ExamsView
            state={gameState}
            onTakeExam={handleTakeExam}
            onOpenMockSimulation={() => setShowMockSimulationModal(true)}
            isTakingExam={isTakingExam}
          />
        )}

        {activeTab === 'SHOP' && (
          <ShopUpgradesView
            state={gameState}
            onBuyUpgrade={handleBuyUpgrade}
          />
        )}

        {activeTab === 'SOCIAL' && (
          <SocialMediaView
            state={gameState}
            onLikePost={handleLikePost}
            onAddPost={handleAddPost}
            onAddComment={handleAddCommentToPost}
            onVotePoll={handleVotePoll}
            onClaimPostReward={handleClaimPostReward}
            onToggleSavePost={handleToggleSavePost}
            onToggleFollow={handleToggleFollow}
            onAddStory={handleAddStory}
            onLikeStory={handleLikeStory}
            onToggleDetox={() => setIsDetoxActive(v => !v)}
            isDetoxActive={isDetoxActive}
          />
        )}

        {activeTab === 'STRESS' && (
          <StressReliefView
            state={gameState}
            onRelaxAction={handleRelaxAction}
            onCompleteBreathing={handleCompleteBreathing}
            onOpenCompanions={() => setShowCompanionsModal(true)}
          />
        )}

        {activeTab === 'GOAL' && (
          <CharacterTargetView
            state={gameState}
            onUpdateCharacter={handleUpdateCharacter}
            onSelectGoal={handleSelectGoal}
            onClaimReward={handleClaimAchievementReward}
            onToggleIgnoreYahya={handleToggleIgnoreYahya}
            onSetDifficulty={handleSetDifficulty}
            onSetColorTheme={handleThemeModeChange}
          />
        )}
      </main>

      {/* Fixed Bottom Ergonomic Tab Navigation */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={tab => {
          setActiveTab(tab);
          if (tab === 'SOCIAL') {
            setHasUnreadSocial(false);
          }
        }}
        stressLevel={gameState.stress}
        hasUnreadSocial={hasUnreadSocial}
      />

      {/* Modals */}
      {examResult && (
        <ExamResultModal
          result={examResult}
          rankDelta={rankDelta}
          onClose={() => setExamResult(null)}
        />
      )}

      {activeEvent && (
        <RandomEventModal
          event={activeEvent}
          onChoose={handleResolveEventChoice}
          onIgnoreYahya={permanent => handleToggleIgnoreYahya(!!permanent)}
          onClose={() => setActiveEvent(null)}
        />
      )}

      {showFinalModal && (
        <FinalExamModal
          state={gameState}
          onResetGame={handleResetGame}
          onClose={() => setShowFinalModal(false)}
        />
      )}

        <SpotifyMusicModal
          isOpen={showSpotifyModal}
          onClose={() => setShowSpotifyModal(false)}
          activeGenre={gameState.activeMusicGenre || 'LO_FI'}
          onSelectGenre={handleSelectMusicGenre}
        />

        <MockExamSimulationModal
          isOpen={showMockSimulationModal}
          state={gameState}
          onFinishSimulation={handleFinishMockSimulation}
          onClose={() => setShowMockSimulationModal(false)}
        />

        <CompanionsModal
          isOpen={showCompanionsModal}
          onClose={() => setShowCompanionsModal(false)}
          state={gameState}
          onPerformAction={handlePerformCompanionAction}
        />
      </MobileFrame>
    </ThemeProvider>
  );
}
