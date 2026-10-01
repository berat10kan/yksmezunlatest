import React from 'react';
import {
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle,
  XCircle,
  RotateCcw,
  Flame,
} from 'lucide-react';
import { GameSaveState } from '../../types/game';
import { sounds } from '../../utils/audio';

interface FinalExamModalProps {
  state: GameSaveState;
  onResetGame: () => void;
  onClose: () => void;
}

export const FinalExamModal: React.FC<FinalExamModalProps> = ({
  state,
  onResetGame,
  onClose,
}) => {
  const isAccepted = state.currentRankEstimate <= state.targetGoal.targetRank;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative flex flex-col gap-4 text-center overflow-hidden">
        {/* Banner accent */}
        <div className={`absolute top-0 left-0 right-0 h-2 ${isAccepted ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400' : 'bg-rose-500'}`} />

        <div className="pt-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 border ${
            isAccepted ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
          }`}>
            <GraduationCap className="w-8 h-8 animate-bounce" />
          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            ÖSYM YKS YERLEŞTİRME SONUCU
          </span>

          <h2 className="text-xl font-extrabold text-white mt-1">
            {isAccepted ? '🎉 TEBRİKLER! KAZANDINIZ!' : 'Emeklerine Sağlık Mezun!'}
          </h2>
          <p className="text-xs text-sky-300 font-semibold mt-0.5">
            {state.targetGoal.name} · {state.targetGoal.major}
          </p>
        </div>

        {/* Score comparison card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Son TYT Netin:</span>
            <span className="font-mono font-bold text-white">{state.currentTytEstimate.toFixed(1)} Net</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Son AYT Netin:</span>
            <span className="font-mono font-bold text-white">{state.currentAytEstimate.toFixed(1)} Net</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
            <span className="text-slate-400">Resmi Türkiye Sıralaması:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              #{state.currentRankEstimate.toLocaleString('tr-TR')}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Gereken Taban Sıralama:</span>
            <span className="font-mono font-bold text-amber-400">
              #{state.targetGoal.targetRank.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {isAccepted
            ? `Bir yıllık uykusuz geceler, çözülen binlerce soru ve fedakarlıklar meyvesini verdi. Artık ${state.targetGoal.name} öğrencisisin!`
            : `Hedefe çok yaklaştın! Çözdüğün ${state.totalQuestionsSolved.toLocaleString('tr-TR')} soru seni muazzam bir seviyeye taşıdı. Başarı bir süreçtir.`}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => {
              sounds.playSuccess();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all"
          >
            Serüvene Devam Et (Sonsuz Mod)
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              onResetGame();
            }}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Yeni Sezona Başla (Sıfırla)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
