import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Flame,
  BookOpen,
  Calendar,
  CalendarCheck,
  Shield,
  FileCheck,
  Target,
  Sparkles,
  Coffee,
  Wind,
  Heart,
  CheckCircle2,
  Coins,
  BatteryCharging,
  Gift,
  Lock,
} from 'lucide-react';
import { Achievement, GameSaveState } from '../../types/game';
import { ACHIEVEMENTS_LIST } from '../../data/initialData';
import { sounds } from '../../utils/audio';

interface AchievementsViewProps {
  state: GameSaveState;
  onClaimReward?: (achievementId: string) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  state,
  onClaimReward,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'STUDY' | 'SURVIVAL' | 'EXAM' | 'TYCOON' | 'SPECIAL'>('ALL');

  const getIcon = (iconName: string, unlocked: boolean) => {
    const className = `w-5 h-5 ${unlocked ? 'text-amber-400' : 'text-slate-500'}`;
    switch (iconName) {
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Award': return <Award className={className} />;
      case 'Calendar': return <Calendar className={className} />;
      case 'CalendarCheck': return <CalendarCheck className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'FileCheck': return <FileCheck className={className} />;
      case 'Trophy': return <Trophy className={className} />;
      case 'Target': return <Target className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Coffee': return <Coffee className={className} />;
      case 'Wind': return <Wind className={className} />;
      case 'Heart': return <Heart className={className} />;
      case 'Medal': return <Medal className={className} />;
      default: return <Award className={className} />;
    }
  };

  const getAchievementProgress = (ach: Achievement): { current: number; max: number; percent: number } => {
    let current = 0;
    switch (ach.id) {
      case 'ach_questions_100':
      case 'ach_questions_1000':
      case 'ach_questions_5000':
        current = state.totalQuestionsSolved;
        break;
      case 'ach_day_10':
      case 'ach_day_30':
      case 'ach_day_50':
        current = state.day;
        break;
      case 'ach_first_exam':
      case 'ach_exams_5':
        current = state.examHistory.length;
        break;
      case 'ach_tyt_90':
      case 'ach_tyt_100':
        current = Math.floor(state.currentTytEstimate);
        break;
      case 'ach_coffee_10':
        current = state.coffeeDrunkCount || 0;
        break;
      case 'ach_breathing_3':
        current = state.breathingCount || 0;
        break;
      case 'ach_yahya_1':
        current = state.yahyaEncounterCount || 0;
        break;
      case 'ach_rank_top10k':
        // For rank, lower is better. Target is 10000.
        current = state.currentRankEstimate <= 10000 ? 10000 : Math.max(0, 100000 - state.currentRankEstimate);
        break;
      default:
        current = 0;
    }

    const max = ach.targetValue;
    const percent = Math.min(100, Math.round((current / max) * 100));
    return { current, max, percent };
  };

  const filteredAchievements = ACHIEVEMENTS_LIST.filter(a => {
    if (selectedCategory === 'ALL') return true;
    return a.category === selectedCategory;
  });

  const totalUnlocked = ACHIEVEMENTS_LIST.filter(a => state.achievements?.[a.id]?.unlocked).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Trophy Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-tight">Mezun Rozetleri & Başarılar</h3>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/40">
                ⚡ Otomatik Hakediş
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Tüm başarılar hedefe ulaştığın an doğrudan hesabına aktarılır; manuel ödül toplamaya gerek yok.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400">Kazanılan</span>
          <div className="text-base font-bold font-mono text-amber-400">
            {totalUnlocked} / {ACHIEVEMENTS_LIST.length}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'ALL', label: 'Tümü' },
          { id: 'STUDY', label: 'Ders & Soru' },
          { id: 'SURVIVAL', label: 'Dayanıklılık' },
          { id: 'EXAM', label: 'Deneme & Sıralama' },
          { id: 'TYCOON', label: 'Oda & Yaşam' },
          { id: 'SPECIAL', label: 'Özel Olaylar' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              sounds.playTap();
              setSelectedCategory(cat.id as typeof selectedCategory);
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Achievement List */}
      <div className="space-y-2">
        {filteredAchievements.map(ach => {
          const achStatus = state.achievements?.[ach.id];
          const isUnlocked = !!achStatus?.unlocked;
          const isClaimed = !!achStatus?.claimed;
          const { current, max, percent } = getAchievementProgress(ach);

          return (
            <div
              key={ach.id}
              className={`border rounded-xl p-3 transition-all flex flex-col gap-2 ${
                isUnlocked
                  ? 'bg-slate-900/90 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isUnlocked
                        ? 'bg-amber-500/20 border-amber-500/40 shadow-xs'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {isUnlocked ? getIcon(ach.icon, true) : <Lock className="w-4 h-4 text-slate-600" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        isUnlocked
                          ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
                          : 'text-slate-500 bg-slate-800 border-slate-700'
                      }`}>
                        {ach.badgeName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{ach.description}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shadow-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Kazanıldı</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500">
                      %{percent}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>İlerleme: {current.toLocaleString('tr-TR')} / {max.toLocaleString('tr-TR')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Coins className="w-2.5 h-2.5" /> +{ach.rewardMoney}₺
                    </span>
                    <span className="text-cyan-400 flex items-center gap-0.5">
                      <BatteryCharging className="w-2.5 h-2.5" /> +{ach.rewardBp} BP
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isUnlocked
                        ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                        : 'bg-slate-700'
                    }`}
                    style={{ width: `${isUnlocked ? 100 : percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
