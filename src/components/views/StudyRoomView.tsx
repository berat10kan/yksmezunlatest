import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Zap,
  Coffee,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  Award,
  Trophy,
  Headphones,
  Music,
  Volume2,
  Heart,
  Flame,
  Lightbulb,
  Gauge,
  Users,
} from 'lucide-react';
import { GameSaveState, MusicGenre, SpotifyTrack, SubjectProgress } from '../../types/game';
import { sounds } from '../../utils/audio';
import {
  ASSET_IMAGES,
  CHARACTER_TRAITS,
  ACHIEVEMENTS_LIST,
  ROOM_THEME_OPTIONS,
  DESK_ACCESSORIES,
  ROOM_LIGHTING_OPTIONS,
  WALL_POSTERS,
  DIFFICULTY_CONFIGS,
} from '../../data/initialData';
import { MUSIC_BUFFS } from '../../data/musicData';
import { DailyMotivationCard } from '../DailyMotivationCard';
import { useMusicTheme } from '../../context/ThemeContext';
import { DeskVisualLayer, getLibraryDeskTier } from './DeskVisualLayer';
import { COMPANION_CHARACTERS } from '../../data/charactersData';

interface StudyRoomViewProps {
  state: GameSaveState;
  onSolveQuestion: (subjectId?: string) => void;
  onStartPomodoro: () => void;
  onDrinkCoffee: () => void;
  onSubjectSelect: (subjectId: string) => void;
  onOpenExams: () => void;
  onOpenAchievements?: () => void;
  onOpenSpotify?: () => void;
  onOpenSettings?: () => void;
  onOpenCompanions?: () => void;
  onTriggerYahyaEvent?: () => void;
  onToggleIgnoreYahya?: (ignored: boolean) => void;
  onBoostMorale?: (amount: number) => void;
  activeMusicGenre?: MusicGenre;
  currentSpotifyTrack?: SpotifyTrack | null;
  isStudying: boolean;
  pomodoroProgress: number; // 0 - 100
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export const StudyRoomView: React.FC<StudyRoomViewProps> = ({
  state,
  onSolveQuestion,
  onStartPomodoro,
  onDrinkCoffee,
  onSubjectSelect,
  onOpenExams,
  onOpenAchievements,
  onOpenSpotify,
  onOpenSettings,
  onOpenCompanions,
  onTriggerYahyaEvent,
  onToggleIgnoreYahya,
  onBoostMorale,
  activeMusicGenre = 'LO_FI',
  currentSpotifyTrack,
  isStudying,
  pomodoroProgress,
}) => {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const activeTrait = CHARACTER_TRAITS.find(t => t.id === state.character.traitId) || CHARACTER_TRAITS[0];
  const { colors } = useMusicTheme();
  const activeBuff = MUSIC_BUFFS[activeMusicGenre] || MUSIC_BUFFS.LO_FI;

  const handleStudyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (state.energy <= 5) {
      sounds.playStressAlert();
      return;
    }
    sounds.playStudyScribble();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gainedBp = state.isFlowState ? '+20 BP 🔥' : '+10 BP';
    const newText: FloatingText = {
      id: Date.now() + Math.random(),
      text: gainedBp,
      x: x + (Math.random() * 40 - 20),
      y: y - 20,
      color: state.isFlowState ? '#f59e0b' : colors.accent,
    };

    setFloatingTexts(prev => [...prev.slice(-6), newText]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== newText.id));
    }, 900);

    onSolveQuestion();
  };

  // Calculate passive BP income per second from upgrades
  const passiveBpRate = (state.upgrades['up_noise_headphone'] || 0) * 1.5 +
    (state.upgrades['up_soru_bankasi'] || 0) * 2.0 +
    (state.upgrades['up_kutuphane'] || 0) * 3.0;

  // Get active room theme image
  const currentRoomTheme = ROOM_THEME_OPTIONS.find(r => r.id === state.character.roomTheme) || ROOM_THEME_OPTIONS[0];
  const currentLighting = ROOM_LIGHTING_OPTIONS.find(l => l.id === state.character.roomLighting) || ROOM_LIGHTING_OPTIONS[0];
  const currentAccessory = DESK_ACCESSORIES.find(a => a.id === state.character.deskAccessory);
  const currentPoster = WALL_POSTERS.find(p => p.id === state.character.wallPoster);
  const libraryLevel = state.upgrades['up_kutuphane'] || 0;
  const deskTierInfo = getLibraryDeskTier(libraryLevel);

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Room Hero Visual Card */}
      <div
        className="relative rounded-2xl overflow-hidden border bg-slate-900 shadow-md transition-all duration-500"
        style={{
          borderColor: currentLighting.borderGlow || `rgba(var(--bg-primary-rgb), 0.4)`,
          boxShadow: `0 0 25px ${currentLighting.bgGlow || 'rgba(var(--bg-primary-rgb), 0.15)'}`,
        }}
      >
        <img
          src={currentRoomTheme.image || ASSET_IMAGES.studyRoom}
          alt={currentRoomTheme.name}
          referrerPolicy="no-referrer"
          className="w-full h-48 object-cover object-center brightness-90 filter"
        />

        {/* Ambient Room Lighting Glow Overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${currentLighting.bgGlow || 'transparent'} 0%, transparent 75%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

        {/* Dynamic Desk Visual Layer (Kütüphane Yükseltme Seviyesine Göre) */}
        <DeskVisualLayer libraryLevel={libraryLevel} isStudying={isStudying} />

        {/* Wall Poster Badge Preview (Top Left under Spotify) */}
        {currentPoster && (
          <div className="absolute top-12 left-2.5 z-10 hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 border border-slate-700/80 text-[10px] text-amber-300 backdrop-blur-xs">
            <span>📌</span>
            <span className="truncate max-w-[120px]">{currentPoster.title}</span>
          </div>
        )}

        {/* Desk Accessory Badge (Top Right below header controls to prevent overlap) */}
        {currentAccessory && (
          <div
            title={`Masa Aksesuarı: ${currentAccessory.name} (${currentAccessory.perk})`}
            className="absolute top-12 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/90 border border-amber-400/40 text-[10px] font-semibold text-amber-200 shadow-md backdrop-blur-md"
          >
            <span>{currentAccessory.icon}</span>
            <span>{currentAccessory.name}</span>
          </div>
        )}

        {/* Top Floating Control Bar (Organized into Left Status & Right Actions with clean wrap/scroll) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-1.5 flex-nowrap pointer-events-none">
          {/* Left: Spotify Music Pill */}
          {onOpenSpotify && (
            <div className="pointer-events-auto shrink-0">
              <button
                onClick={() => {
                  sounds.playTap();
                  onOpenSpotify();
                }}
                title="Spotify Müzik & Avantaj Odası"
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-950/90 hover:bg-slate-900 border text-white text-[11px] font-semibold backdrop-blur-md active:scale-95 transition-all shadow-md group cursor-pointer max-w-[140px] sm:max-w-[180px]"
                style={{
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                />
                <span className="font-bold text-[10px] shrink-0" style={{ color: 'var(--text-accent)' }}>
                  {activeBuff.badge}
                </span>
                <span className="text-slate-300 text-[10px] truncate">
                  {currentSpotifyTrack ? currentSpotifyTrack.name : activeBuff.name}
                </span>
              </button>
            </div>
          )}

          {/* Right: Desk Quick Action Hotspots */}
          <div className="pointer-events-auto flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 justify-end">
            {/* Companions Interaction Button */}
            {onOpenCompanions && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onOpenCompanions();
                }}
                title="Kütüphane Çevresi: Zehra Abla & Dostlar"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-950/95 to-indigo-950/95 hover:from-emerald-900 hover:to-indigo-900 border border-emerald-400/60 text-emerald-200 text-xs font-bold backdrop-blur-md active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-emerald-300 whitespace-nowrap">Dostlar</span>
                <span className="px-1 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 text-[9px] font-mono border border-emerald-500/40">
                  {COMPANION_CHARACTERS.length}
                </span>
              </button>
            )}

            {/* Yahya Hoca Event Button */}
            {onTriggerYahyaEvent && !state.disableYahyaEvents && (
              <button
                onClick={() => {
                  sounds.playCoin();
                  onTriggerYahyaEvent();
                }}
                title="Yahya Hoca & Yeliz Vakası"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-950/90 to-rose-950/90 hover:from-amber-900 hover:to-rose-900 border border-amber-400/60 text-amber-200 text-xs font-bold backdrop-blur-md active:scale-95 transition-all shadow-md shrink-0 cursor-pointer animate-pulse"
              >
                <span className="text-xs">📐</span>
                <span className="text-[11px] text-amber-300 whitespace-nowrap hidden sm:inline">Yahya Hoca</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              </button>
            )}

            {/* Yahya Hoca Ignored Indicator */}
            {state.disableYahyaEvents && onToggleIgnoreYahya && (
              <button
                onClick={() => {
                  sounds.playSuccess();
                  onToggleIgnoreYahya(false);
                }}
                title="Yahya Hoca Olayları Görmezden Geliniyor (Geri Açmak İçin Dokun)"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-medium backdrop-blur-md transition-all shrink-0 cursor-pointer"
              >
                <span>🔇 Yahya Gizli</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.playRelax();
                onDrinkCoffee();
              }}
              title="Kahve İç (+10 Enerji)"
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-medium backdrop-blur-md active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">Kahve</span>
            </button>

            {onOpenAchievements && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onOpenAchievements();
                }}
                title="Rozetler & Başarılar"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-amber-400/50 text-amber-300 text-xs font-medium backdrop-blur-md active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="whitespace-nowrap">Rozet</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onOpenSettings();
                }}
                title="Oyun Zorluk Derecesi"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border text-xs font-semibold backdrop-blur-md active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
                style={{
                  borderColor: `${DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED']?.color}60`,
                  color: DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED']?.color,
                }}
              >
                <Gauge className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED']?.name.split(' ')[0]}</span>
              </button>
            )}

            <button
              onClick={onOpenExams}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-sky-500/40 text-sky-300 text-xs font-medium backdrop-blur-md active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="whitespace-nowrap">Deneme</span>
            </button>
          </div>
        </div>

        {/* Character Card Overlay */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between z-10 pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-lg shrink-0 bg-slate-800">
              <img
                src={state.character.avatarImage || ASSET_IMAGES.avatarDefault}
                alt={state.character.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1">
                  <span>{state.character.name}</span>
                  {state.character.gender && (
                    <span className="text-[10px] text-slate-300 font-normal">
                      {state.character.gender === 'male' ? '♂' : '♀'}
                    </span>
                  )}
                </h2>
                <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                  {state.character.nickname || 'Derece Adayı'}
                </span>
                {state.character.eyewear && state.character.eyewear !== 'none' && (
                  <span className="text-[9px] text-sky-300 bg-sky-500/20 px-1 rounded border border-sky-500/30">
                    👓 Gözlüklü
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                Hedef: <span className="text-sky-300 font-medium">{state.targetGoal.name}</span>
              </p>
              {state.character.mottoText && (
                <p className="text-[10px] text-amber-300/90 italic line-clamp-1 mt-0.5">
                  "{state.character.mottoText}"
                </p>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] text-slate-400">Tahmini Sıralama</div>
            <div className="text-xs font-bold font-mono text-emerald-400">
              #{state.currentRankEstimate.toLocaleString('tr-TR')}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Desk Visual Status Banner (Library Upgrade Level Indicator) */}
      <div className={`p-2.5 rounded-xl border bg-slate-900/90 flex items-center justify-between gap-2 shadow-xs transition-all ${deskTierInfo.badgeBg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">
            {deskTierInfo.tier === 'MESSY' ? '📑' : deskTierInfo.tier === 'ORGANIZED' ? '📚' : '👑'}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white">
                {deskTierInfo.title}
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${deskTierInfo.badgeBg}`}>
                Kütüphane Lv.{libraryLevel}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 truncate mt-0.5">
              {deskTierInfo.description}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[9px] text-slate-400 block">Masa Verimi</span>
          <span className={`text-xs font-bold font-mono ${deskTierInfo.badgeText}`}>
            {deskTierInfo.tier === 'MESSY' ? '%100' : deskTierInfo.tier === 'ORGANIZED' ? '%125' : '%160'}
          </span>
        </div>
      </div>

      {/* Spotify Active Music Buff Banner */}
      <div className={`p-2.5 rounded-xl border bg-slate-950/90 flex items-center justify-between gap-2 shadow-xs ${activeBuff.color}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            {activeMusicGenre === 'CLASSICAL' && <Sparkles className="w-4 h-4 text-purple-400" />}
            {(activeMusicGenre === 'METAL_ROCK' || activeMusicGenre === 'ROCK_TRAP') && <Zap className="w-4 h-4 text-rose-400" />}
            {activeMusicGenre === 'LO_FI' && <Headphones className="w-4 h-4 text-emerald-400" />}
            {activeMusicGenre === 'RAP_TRAP' && <Flame className="w-4 h-4 text-orange-400" />}
            {(activeMusicGenre === 'POP_DANCE' || activeMusicGenre === 'POP_ENERGY') && <Sparkles className="w-4 h-4 text-cyan-400" />}
            {activeMusicGenre === 'TURKISH_NOSTALGIA' && <Heart className="w-4 h-4 text-amber-400" />}
            {activeMusicGenre === 'JAZZ_ACOUSTIC' && <Coffee className="w-4 h-4 text-yellow-400" />}
            {activeMusicGenre === 'PHONK_DRIFT' && <Zap className="w-4 h-4 text-violet-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">
                {currentSpotifyTrack ? `${currentSpotifyTrack.name} • ${currentSpotifyTrack.artist}` : activeBuff.name}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-[#1DB954] shrink-0">
                {activeBuff.badge}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 truncate mt-0.5">{activeBuff.bonusSummary}</p>
          </div>
        </div>

        {onOpenSpotify && (
          <button
            onClick={() => {
              sounds.playTap();
              onOpenSpotify();
            }}
            className="px-2 py-1 rounded-lg bg-[#1DB954]/20 hover:bg-[#1DB954]/30 border border-[#1DB954]/50 text-[#1DB954] font-bold text-[10px] whitespace-nowrap active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            Müzik Değiştir
          </button>
        )}
      </div>

      {/* Target Progress Bar Tracker */}
      <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            Hedef Seviye: {state.targetGoal.major}
          </span>
          <span className="text-sky-400 font-mono font-bold">
            TYT: {state.currentTytEstimate.toFixed(1)} / {state.targetGoal.requiredTytNet}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(10, (state.currentTytEstimate / state.targetGoal.requiredTytNet) * 100))}%`,
            }}
          />
        </div>
      </div>

      {/* Dynamic Daily Motivation Card */}
      <DailyMotivationCard
        onBoostMorale={onBoostMorale || (() => {})}
        currentMorale={state.morale}
      />

      {/* Primary Tycoon Action Controls */}
      <div className="grid grid-cols-2 gap-2 relative">
        {/* Floating text particles on study button */}
        {floatingTexts.map(f => (
          <span
            key={f.id}
            className="absolute pointer-events-none text-xs font-bold font-mono animate-out fade-out slide-out-to-top duration-700 z-20"
            style={{
              left: `${f.x}px`,
              top: `${f.y}px`,
              color: f.color,
            }}
          >
            {f.text}
          </span>
        ))}

        {/* Big Soru Çöz Button with Theme Color */}
        <button
          onClick={handleStudyClick}
          disabled={state.energy <= 5}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border font-medium transition-all active:scale-95 shadow-md relative overflow-hidden select-none cursor-pointer ${
            state.energy <= 5
              ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              : 'hover:brightness-110 text-white'
          }`}
          style={
            state.energy > 5
              ? {
                  background: `linear-gradient(135deg, rgba(var(--bg-primary-rgb), 0.9) 0%, #1e1b4b 100%)`,
                  borderColor: `rgba(var(--bg-primary-rgb), 0.5)`,
                  boxShadow: `0 4px 20px rgba(var(--bg-primary-rgb), 0.25)`,
                }
              : undefined
          }
        >
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <BookOpen className="w-4 h-4" />
            <span>Soru Çöz</span>
          </div>
          <span className="text-[10px] text-white/80 mt-0.5">
            {state.energy <= 5 ? 'Enerji Bitti! Dinlen' : '-2 Enerji · +10 BP'}
          </span>
        </button>

        {/* Pomodoro Focus Button */}
        <button
          onClick={() => {
            sounds.playTap();
            onStartPomodoro();
          }}
          disabled={isStudying || state.energy < 15}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border font-medium transition-all active:scale-95 shadow-md relative overflow-hidden select-none ${
            isStudying
              ? 'bg-amber-950/80 border-amber-600/50 text-amber-300'
              : state.energy < 15
              ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 border-amber-400/40 text-white cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <BrainCircuit className="w-4 h-4" />
            <span>{isStudying ? 'Odaklanıyor...' : 'Pomodoro (25 Dk)'}</span>
          </div>
          <span className="text-[10px] text-amber-100/80 mt-0.5">
            {isStudying ? `%${Math.round(pomodoroProgress)} Tamamlandı` : '-12 Enerji · +85 BP'}
          </span>
          {isStudying && (
            <div
              className="absolute bottom-0 left-0 h-1 bg-amber-300 transition-all duration-300"
              style={{ width: `${pomodoroProgress}%` }}
            />
          )}
        </button>
      </div>

      {/* Passive Income Telemetry */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Pasif Odak Kazancı:</span>
        </span>
        <span className="font-mono font-semibold text-sky-400">
          +{passiveBpRate.toFixed(1)} BP/sn
        </span>
      </div>

      {/* Active Trait Perk Badge */}
      <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">{activeTrait.name}</div>
            <div className="text-[10px] text-slate-400">{activeTrait.description}</div>
          </div>
        </div>
        <span className="text-[10px] font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          {activeTrait.badge}
        </span>
      </div>

      {/* Subject Mastery List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Ders Hakimiyeti & Soru Sayıları
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Toplam: {state.totalQuestionsSolved.toLocaleString('tr-TR')} Soru
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {state.subjects.map((sub: SubjectProgress) => (
            <div
              key={sub.id}
              className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-2.5 transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    sub.field === 'TYT' ? 'bg-sky-500/20 text-sky-300' : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {sub.field}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{sub.name}</span>
                </div>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onSubjectSelect(sub.id);
                  }}
                  className="px-2 py-0.5 text-[11px] font-medium text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 rounded border border-sky-500/30 transition-colors"
                >
                  Bu Derse Odaklan
                </button>
              </div>

              {/* Progress bar and details */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      sub.mastery >= 75
                        ? 'bg-emerald-500'
                        : sub.mastery >= 45
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                    }`}
                    style={{ width: `${Math.min(100, sub.mastery)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-300 w-10 text-right">
                  %{Math.round(sub.mastery)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {sub.completedQuestions} çözüldü
                </span>
                <span>
                  {sub.mastery < 30 ? 'Temel Konular' : sub.mastery < 70 ? 'Yeni Nesil Soru Çözümü' : 'Deneme Aşaması (Derece)'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
