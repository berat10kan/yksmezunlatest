import React from 'react';
import {
  Award,
  TrendingUp,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { ExamRecord } from '../../types/game';
import { sounds } from '../../utils/audio';

interface ExamResultModalProps {
  result: ExamRecord;
  rankDelta: number;
  onClose: () => void;
}

export const ExamResultModal: React.FC<ExamResultModalProps> = ({
  result,
  rankDelta,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-4 shadow-2xl relative overflow-hidden flex flex-col gap-3">
        {/* Confetti / Glow effect */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400" />

        {/* Modal Header */}
        <div className="text-center pt-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Award className="w-6 h-6 animate-bounce" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">Sınav Tamamlandı!</h3>
          <p className="text-xs text-slate-300 font-medium mt-0.5">{result.name}</p>
        </div>

        {/* Big Score Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            {result.tytScore ? 'Toplam TYT Neti' : 'Toplam AYT Neti'}
          </span>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-0.5">
            {result.tytScore ? result.tytScore.total.toFixed(2) : result.aytScore?.total.toFixed(2)}
          </div>
          {result.isRecordScore && (
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full mt-1.5 border border-amber-500/30">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>YENİ ŞAHSİ REKOR!</span>
            </div>
          )}
        </div>

        {/* Detailed Breakdown if TYT */}
        {result.tytScore && (
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <span className="text-[9px] text-slate-400">Türkçe</span>
              <div className="text-xs font-bold font-mono text-white mt-0.5">
                {result.tytScore.turkce.toFixed(1)}
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <span className="text-[9px] text-slate-400">Matematik</span>
              <div className="text-xs font-bold font-mono text-white mt-0.5">
                {result.tytScore.matematik.toFixed(1)}
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <span className="text-[9px] text-slate-400">Fen Bil.</span>
              <div className="text-xs font-bold font-mono text-white mt-0.5">
                {result.tytScore.fen.toFixed(1)}
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <span className="text-[9px] text-slate-400">Sosyal</span>
              <div className="text-xs font-bold font-mono text-white mt-0.5">
                {result.tytScore.sosyal.toFixed(1)}
              </div>
            </div>
          </div>
        )}

        {/* Mock Exam Simulation Specific Details */}
        {result.simulationDetails && (
          <div className="bg-slate-950 border border-red-500/30 rounded-xl p-2.5 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-xs font-bold text-red-300 pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>3'lü Oturum Dayanıklılık Analizi</span>
              </span>
              <span className="text-emerald-400 font-mono">+{result.simulationDetails.enduranceBonus} BP Bonus</span>
            </div>

            <div className="space-y-1 text-slate-300">
              {result.simulationDetails.rounds.map(r => (
                <div key={r.roundIndex} className="flex items-center justify-between text-[10px]">
                  <span>Oturum {r.roundIndex} ({r.actionTaken}):</span>
                  <span className="font-mono text-white font-bold">
                    {r.scoreNet.toFixed(1)} Net · <span className="text-rose-400">%{r.fatigueLevel} Yorgunluk</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Turkey Ranking */}
        <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400">Güncel Tahmini Sıralama</div>
            <div className="text-sm font-bold font-mono text-sky-300">
              #{result.estimatedRank.toLocaleString('tr-TR')}
            </div>
          </div>

          <div className="text-right">
            {rankDelta > 0 ? (
              <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                +{rankDelta.toLocaleString('tr-TR')} Sıra Yükseliş
              </span>
            ) : (
              <span className="text-xs font-bold font-mono text-slate-400">Sıralama Korundu</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            sounds.playTap();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all mt-1"
        >
          Sonuçları Kabul Et & Devam Et
        </button>
      </div>
    </div>
  );
};
