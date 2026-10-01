import React from 'react';
import {
  BatteryCharging,
  Coins,
  Brain,
  Zap,
  Heart,
  Volume2,
  VolumeX,
  AlertTriangle,
  Flame,
  Calendar,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';
import { GameSaveState, TimeOfDay, ColorThemeMode } from '../types/game';
import { sounds } from '../utils/audio';
import { useMusicTheme } from '../context/ThemeContext';

interface TopStatusBarProps {
  state: GameSaveState;
  onToggleSound: () => void;
  onAdvanceTime: () => void;
  onThemeModeChange?: (mode: ColorThemeMode) => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  state,
  onToggleSound,
  onAdvanceTime,
  onThemeModeChange,
}) => {
  const { mode, resolvedMode, setMode } = useMusicTheme();

  const handleCycleTheme = () => {
    sounds.playTap();
    // Cycle: DARK -> LIGHT -> SYSTEM -> DARK
    const nextMode: ColorThemeMode =
      mode === 'DARK' ? 'LIGHT' : mode === 'LIGHT' ? 'SYSTEM' : 'DARK';
    setMode(nextMode);
    if (onThemeModeChange) {
      onThemeModeChange(nextMode);
    }
  };

  const getTimeIcon = (tod: TimeOfDay) => {
    switch (tod) {
      case 'SABAH': return '🌅';
      case 'ÖĞLE': return '☀️';
      case 'İKİNDİ': return '🌤️';
      case 'AKŞAM': return '🌆';
      case 'GECE': return '🌙';
    }
  };

  const getEnergyColor = (val: number) => {
    if (val > 60) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (val > 25) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
  };

  const getStressColor = (val: number) => {
    if (val < 40) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (val < 75) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
  };

  const getMoraleColor = (val: number) => {
    if (val > 70) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    if (val > 35) return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  return (
    <header className="shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-3 py-2 z-30 select-none">
      {/* Upper status: Day & Time & Sound & Next Phase */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <img
            src="/app-icon.svg"
            alt="Mezun Tycoon Icon"
            className="w-5 h-5 rounded-md shadow-xs object-cover border border-amber-400/40"
          />
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">GÜN {state.day}</span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            YKS'ye <span className="text-amber-400 font-bold font-mono">{state.daysRemaining}</span> gün
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sounds.playTap();
              onAdvanceTime();
            }}
            title="Zamanı İlerlet"
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-md transition-all shadow-xs"
          >
            <span>{getTimeIcon(state.timeOfDay)}</span>
            <span className="text-[11px] tracking-tight">{state.timeOfDay}</span>
            <span className="text-[9px] text-slate-400 ml-0.5">▶</span>
          </button>

          <button
            onClick={onToggleSound}
            aria-label="Ses Aç/Kapat"
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {state.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {/* Karanlık / Aydınlık / Sistem Teması Geçiş Butonu */}
          <button
            onClick={handleCycleTheme}
            title={`Tema Modu: ${mode === 'DARK' ? 'Karanlık Mod' : mode === 'LIGHT' ? 'Aydınlık Mod' : 'Sistem Modu'} (Tıkla Değiştir)`}
            aria-label="Tema Modu"
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            {mode === 'DARK' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            {mode === 'LIGHT' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
            {mode === 'SYSTEM' && (
              <div className="flex items-center text-[10px] text-sky-400 font-mono gap-0.5">
                <Laptop className="w-3.5 h-3.5 text-sky-400" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Primary Vitals Grid */}
      <div className="grid grid-cols-5 gap-1.5 pt-1.5 text-center">
        {/* Enerji */}
        <div className={`flex flex-col items-center justify-center p-1 rounded-md border ${getEnergyColor(state.energy)} transition-colors`}>
          <div className="flex items-center gap-1 text-[10px] font-medium leading-none mb-0.5">
            <Zap className="w-3 h-3" />
            <span>Enerji</span>
          </div>
          <span className="text-xs font-bold font-mono tabular-nums leading-tight">
            {Math.round(state.energy)}%
          </span>
        </div>

        {/* Stres */}
        <div className={`flex flex-col items-center justify-center p-1 rounded-md border ${getStressColor(state.stress)} transition-colors`}>
          <div className="flex items-center gap-1 text-[10px] font-medium leading-none mb-0.5">
            {state.stress >= 80 ? (
              <AlertTriangle className="w-3 h-3 text-rose-400" />
            ) : (
              <Brain className="w-3 h-3" />
            )}
            <span>Stres</span>
          </div>
          <span className="text-xs font-bold font-mono tabular-nums leading-tight">
            {Math.round(state.stress)}%
          </span>
        </div>

        {/* Moral */}
        <div className={`flex flex-col items-center justify-center p-1 rounded-md border ${getMoraleColor(state.morale)} transition-colors`}>
          <div className="flex items-center gap-1 text-[10px] font-medium leading-none mb-0.5">
            {state.isFlowState ? (
              <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
            ) : (
              <Heart className="w-3 h-3" />
            )}
            <span>Moral</span>
          </div>
          <span className="text-xs font-bold font-mono tabular-nums leading-tight">
            {Math.round(state.morale)}%
          </span>
        </div>

        {/* Bilgi Puanı (BP) */}
        <div className="flex flex-col items-center justify-center p-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
          <div className="flex items-center gap-1 text-[10px] font-medium leading-none mb-0.5">
            <BatteryCharging className="w-3 h-3 text-cyan-400" />
            <span>BP</span>
          </div>
          <span className="text-xs font-bold font-mono tabular-nums leading-tight">
            {state.bp > 9999 ? `${(state.bp / 1000).toFixed(1)}k` : Math.floor(state.bp)}
          </span>
        </div>

        {/* Harçlık (₺) */}
        <div className="flex flex-col items-center justify-center p-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <div className="flex items-center gap-1 text-[10px] font-medium leading-none mb-0.5">
            <Coins className="w-3 h-3 text-emerald-400" />
            <span>Harçlık</span>
          </div>
          <span className="text-xs font-bold font-mono tabular-nums leading-tight">
            ₺{Math.floor(state.money)}
          </span>
        </div>
      </div>

      {/* Flow State or Burnout active alerts */}
      {state.isBurnout && (
        <div className="mt-1.5 px-2 py-1 rounded bg-rose-950/80 border border-rose-600/50 flex items-center justify-between text-[11px] text-rose-300 animate-pulse">
          <span className="font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            Tükenmişlik Sendromu!
          </span>
          <span className="text-[10px] text-rose-200">Çalışma verimi -%50. Dinlenmelisin!</span>
        </div>
      )}

      {state.isFlowState && !state.isBurnout && (
        <div className="mt-1.5 px-2 py-1 rounded bg-amber-950/80 border border-amber-500/50 flex items-center justify-between text-[11px] text-amber-300">
          <span className="font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Flow Hali Aktif!
          </span>
          <span className="text-[10px] text-amber-200">Soru çözme & BP x2 Kat!</span>
        </div>
      )}
    </header>
  );
};
