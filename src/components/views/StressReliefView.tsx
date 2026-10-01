import React, { useState, useEffect } from 'react';
import {
  Heart,
  Smile,
  Coffee,
  Moon,
  Footprints,
  Music,
  Users,
  Wind,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { GameSaveState } from '../../types/game';
import { sounds } from '../../utils/audio';

interface StressReliefViewProps {
  state: GameSaveState;
  onRelaxAction: (actionType: 'WALK' | 'CAKE_TEA' | 'MUSIC' | 'NAP' | 'FRIEND_CALL') => void;
  onCompleteBreathing: () => void;
  onOpenCompanions?: () => void;
}

export const StressReliefView: React.FC<StressReliefViewProps> = ({
  state,
  onRelaxAction,
  onCompleteBreathing,
  onOpenCompanions,
}) => {
  const [breathingPhase, setBreathingPhase] = useState<'IDLE' | 'INHALE' | 'HOLD' | 'EXHALE'>('IDLE');
  const [breathingCounter, setBreathingCounter] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (breathingPhase === 'INHALE') {
      if (breathingCounter < 4) {
        timer = setTimeout(() => setBreathingCounter(c => c + 1), 1000);
      } else {
        setBreathingPhase('HOLD');
        setBreathingCounter(0);
      }
    } else if (breathingPhase === 'HOLD') {
      if (breathingCounter < 7) {
        timer = setTimeout(() => setBreathingCounter(c => c + 1), 1000);
      } else {
        setBreathingPhase('EXHALE');
        setBreathingCounter(0);
      }
    } else if (breathingPhase === 'EXHALE') {
      if (breathingCounter < 8) {
        timer = setTimeout(() => setBreathingCounter(c => c + 1), 1000);
      } else {
        const nextCycles = cyclesCompleted + 1;
        setCyclesCompleted(nextCycles);
        if (nextCycles >= 2) {
          sounds.playSuccess();
          onCompleteBreathing();
          setBreathingPhase('IDLE');
          setBreathingCounter(0);
        } else {
          setBreathingPhase('INHALE');
          setBreathingCounter(0);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [breathingPhase, breathingCounter, cyclesCompleted, onCompleteBreathing]);

  const handleStartBreathing = () => {
    sounds.playRelax();
    setBreathingPhase('INHALE');
    setBreathingCounter(0);
    setCyclesCompleted(0);
  };

  const relaxationActions = [
    {
      id: 'CAKE_TEA',
      name: 'Anne Keki & Sıcak Çay Molası',
      icon: Coffee,
      stress: -15,
      energy: +20,
      morale: +15,
      desc: 'Ev yapımı kakaolu kek ve demli çay her zaman iyi gelir.',
      cost: 'Ücretsiz',
    },
    {
      id: 'WALK',
      name: 'Mahallede 15 Dk Temiz Hava Yürüyüşü',
      icon: Footprints,
      stress: -18,
      energy: -5,
      morale: +12,
      desc: 'Masanın başından kalkıp kafayı boşaltmak zihni tazeler.',
      cost: 'Ücretsiz',
    },
    {
      id: 'MUSIC',
      name: 'Lo-Fi Beats & Yağmur Sesi',
      icon: Music,
      stress: -12,
      energy: +5,
      morale: +10,
      desc: 'Kulaklığı tak, pencere kenarında sadece melodiyi hisset.',
      cost: 'Ücretsiz',
    },
    {
      id: 'NAP',
      name: '20 Dk Güç Uykusu (Power Nap)',
      icon: Moon,
      stress: -14,
      energy: +30,
      morale: +8,
      desc: 'Alarmı kur ve derin bir soluklanma uykusuna dal.',
      cost: 'Ücretsiz',
    },
    {
      id: 'FRIEND_CALL',
      name: 'Mezun Arkadaşla Dertleşme Telefonu',
      icon: Users,
      stress: -22,
      energy: -5,
      morale: +20,
      desc: '"Sen kaç nettesin kanka?" kaygısını unutup biraz gülün.',
      cost: 'Ücretsiz',
    },
  ];

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Stres & Mental Sağlık Merkezi</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Yüksek stres (%80+) tükenmişliğe yol açar ve net verimini yarı yarıya düşürür.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400">Mevcut Stres</span>
          <div className={`text-sm font-bold font-mono ${state.stress > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
            %{Math.round(state.stress)}
          </div>
        </div>
      </div>

      {/* Interactive 4-7-8 Breathing Circle Mini-Game */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden">
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300 mb-1">
          <Wind className="w-4 h-4 text-sky-400" />
          <span>4-7-8 Taktiksel Nefes Egzersizi</span>
        </div>
        <p className="text-[11px] text-slate-400 max-w-xs mb-4">
          Nabzı düşürür, sınav kaygısını yok eder ve tükenmişlik sendromunu anında temizler.
        </p>

        {/* Breathing Animation Orb */}
        <div className="relative w-36 h-36 flex items-center justify-center my-2">
          {/* Animated pulsing outer ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-1000 ${
              breathingPhase === 'INHALE'
                ? 'scale-110 border-sky-400/80 animate-pulse'
                : breathingPhase === 'HOLD'
                ? 'scale-100 border-amber-400/80'
                : breathingPhase === 'EXHALE'
                ? 'scale-75 border-indigo-400/80'
                : 'scale-90 border-slate-700'
            }`}
          />

          {/* Central orb */}
          <div
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-xl ${
              breathingPhase === 'INHALE'
                ? 'bg-sky-500/20 text-sky-300 scale-105 border border-sky-400'
                : breathingPhase === 'HOLD'
                ? 'bg-amber-500/20 text-amber-300 scale-100 border border-amber-400'
                : breathingPhase === 'EXHALE'
                ? 'bg-indigo-500/20 text-indigo-300 scale-90 border border-indigo-400'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {breathingPhase === 'IDLE' ? (
              <Wind className="w-8 h-8 text-sky-400" />
            ) : (
              <>
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  {breathingPhase === 'INHALE' ? 'Nefes Al' : breathingPhase === 'HOLD' ? 'Tut' : 'Ver'}
                </span>
                <span className="text-2xl font-bold font-mono mt-0.5">
                  {breathingCounter}s
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        {breathingPhase === 'IDLE' ? (
          <button
            onClick={handleStartBreathing}
            className="mt-3 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Nefes Egzersizini Başlat (-25 Stres)</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-slate-300 font-mono">Döngü: {cyclesCompleted + 1} / 2</span>
            <button
              onClick={() => {
                setBreathingPhase('IDLE');
                setBreathingCounter(0);
              }}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline"
            >
              İptal
            </button>
          </div>
        )}
      </div>

      {/* Quick Relaxation Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Hızlı Mola & Rahatlama Aktiviteleri
          </h3>
          {onOpenCompanions && (
            <button
              onClick={() => {
                sounds.playTap();
                onOpenCompanions();
              }}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Users className="w-3 h-3" />
              <span>Dostlar & Ablalar (10)</span>
            </button>
          )}
        </div>

        {/* Companions Quick Banner */}
        {onOpenCompanions && (
          <div
            onClick={() => {
              sounds.playTap();
              onOpenCompanions();
            }}
            className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 via-indigo-950/60 to-slate-900 border border-emerald-500/40 hover:border-emerald-400/70 transition-all cursor-pointer flex items-center justify-between shadow-md group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Kütüphane Dostları & Ablalar</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 rounded font-semibold">10 Karakter</span>
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Zehra Abla, Bilge, Melek, Beytullah, Kerim, Uğur, Tahir, Elif ile görüş!
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
              Yanlarına Git →
            </span>
          </div>
        )}

        {relaxationActions.map(action => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700/80 transition-all"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-amber-400">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{action.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{action.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] font-mono mt-1">
                    <span className="text-emerald-400 font-semibold">{action.stress} Stres</span>
                    <span>·</span>
                    <span className="text-amber-400 font-semibold">{action.energy > 0 ? `+${action.energy}` : action.energy} Enerji</span>
                    <span>·</span>
                    <span className="text-indigo-400 font-semibold">+{action.morale} Moral</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.playRelax();
                  onRelaxAction(action.id as Parameters<typeof onRelaxAction>[0]);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-slate-200 border border-slate-700 whitespace-nowrap transition-colors"
              >
                Mola Ver
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
