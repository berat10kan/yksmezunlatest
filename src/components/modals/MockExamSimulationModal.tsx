import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Clock,
  Heart,
  AlertTriangle,
  Award,
  ChevronRight,
  Shield,
  Coffee,
  Sparkles,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { GameSaveState, ExamRecord } from '../../types/game';
import { sounds } from '../../utils/audio';

export interface MockSimulationRoundResult {
  roundIndex: number;
  name: string;
  fatigueLevel: number;
  scoreNet: number;
  energySpent: number;
  actionTaken: string;
}

interface MockExamSimulationModalProps {
  isOpen: boolean;
  state: GameSaveState;
  onFinishSimulation: (record: ExamRecord) => void;
  onClose: () => void;
}

export const MockExamSimulationModal: React.FC<MockExamSimulationModalProps> = ({
  isOpen,
  state,
  onFinishSimulation,
  onClose,
}) => {
  // Session progression: 3 Mini-Exams (Oturum 1: TYT Hız Paragraf, Oturum 2: AYT Zor Problem, Oturum 3: Karışık Zirve Fen-Sosyal)
  const [currentRound, setCurrentRound] = useState<1 | 2 | 3>(1);
  const [sessionEnergy, setSessionEnergy] = useState<number>(state.energy);
  const [sessionStress, setSessionStress] = useState<number>(state.stress);
  const [fatigue, setFatigue] = useState<number>(10); // 0 - 100 accumulates
  const [roundPace, setRoundPace] = useState<'AGGRESSIVE' | 'STEADY' | 'CONSERVATIVE'>('STEADY');
  const [isProcessingRound, setIsProcessingRound] = useState(false);
  const [roundProgress, setRoundProgress] = useState(0);

  // Stored completed mini-exam rounds
  const [roundResults, setRoundResults] = useState<MockSimulationRoundResult[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentRound(1);
      setSessionEnergy(state.energy);
      setSessionStress(state.stress);
      setFatigue(10);
      setRoundPace('STEADY');
      setRoundResults([]);
      setIsCompleted(false);
      setIsProcessingRound(false);
      setRoundProgress(0);
    }
  }, [isOpen, state.energy, state.stress]);

  if (!isOpen) return null;

  const roundsConfig = [
    {
      round: 1,
      title: '1. Oturum: TYT Paragraf & Mantık Koşusu',
      subtitle: '40 Soru · Zihin henüz dinç, tempo yakalama safhası.',
      baseEnergyCost: 14,
      baseStressGain: 6,
      maxNet: 40,
    },
    {
      round: 2,
      title: '2. Oturum: AYT Matematik & Geometri Barikatı',
      subtitle: '40 Soru · Ağır problem ve analitik düşünme, zihinsel yorgunluk tırmanıyor.',
      baseEnergyCost: 18,
      baseStressGain: 12,
      maxNet: 40,
    },
    {
      round: 3,
      title: '3. Oturum: Büyük Final Fen & Sosyal Maratonu',
      subtitle: '40 Soru · Aşırı yorgunluk ve tükenmişlik baskısı altında son 15 dakika.',
      baseEnergyCost: 20,
      baseStressGain: 16,
      maxNet: 40,
    },
  ];

  const currentConfig = roundsConfig[currentRound - 1];

  // Intermission mini-actions before starting round
  const handleQuickDrinkWater = () => {
    sounds.playRelax();
    setSessionEnergy(prev => Math.min(100, prev + 8));
    setSessionStress(prev => Math.max(0, prev - 6));
    setFatigue(prev => Math.max(0, prev - 12));
  };

  const handleDeepBreath = () => {
    sounds.playRelax();
    setSessionStress(prev => Math.max(0, prev - 12));
    setFatigue(prev => Math.max(0, prev - 8));
  };

  const handleExecuteRound = () => {
    if (isProcessingRound || isCompleted) return;

    sounds.playExamBell();
    setIsProcessingRound(true);
    setRoundProgress(0);

    const interval = setInterval(() => {
      setRoundProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 25;
      });
    }, 180);

    setTimeout(() => {
      clearInterval(interval);

      // Calculate Round Performance based on Fatigue, Pace, Mastery and Character Traits
      const masteryAvg = state.subjects.reduce((acc, s) => acc + s.mastery, 0) / state.subjects.length;
      const traitSpeed = state.character.traitId === 'exam_tactician' ? 2.0 : 0;
      
      let paceNetBonus = 0;
      let paceEnergyMult = 1.0;
      let paceStressMult = 1.0;
      let paceAction = 'Dengeli Strateji';

      if (roundPace === 'AGGRESSIVE') {
        paceNetBonus = (Math.random() * 4) - 0.5; // High potential, higher variance
        paceEnergyMult = 1.4;
        paceStressMult = 1.5;
        paceAction = 'Agresif Hücum';
      } else if (roundPace === 'CONSERVATIVE') {
        paceNetBonus = -1.5; // Safe, low fatigue
        paceEnergyMult = 0.7;
        paceStressMult = 0.6;
        paceAction = 'Temkinli Enerji Tasarrufu';
      }

      // Fatigue Penalty: As fatigue climbs beyond 40%, net performance drops exponentially
      const fatiguePenalty = Math.max(0, (fatigue - 35) * 0.12);

      // Base net calculation for 40 questions
      const rawNet = 18 + (masteryAvg * 0.18) + traitSpeed + paceNetBonus - fatiguePenalty + (Math.random() * 2 - 1);
      const roundNet = Math.max(8, Math.min(currentConfig.maxNet, Math.round(rawNet * 10) / 10));

      const energyUsed = Math.round(currentConfig.baseEnergyCost * paceEnergyMult);
      const stressAdded = Math.round(currentConfig.baseStressGain * paceStressMult);
      const newFatigue = Math.min(100, fatigue + (roundPace === 'AGGRESSIVE' ? 28 : roundPace === 'STEADY' ? 20 : 12));

      const updatedEnergy = Math.max(0, sessionEnergy - energyUsed);
      const updatedStress = Math.min(100, sessionStress + stressAdded);

      setSessionEnergy(updatedEnergy);
      setSessionStress(updatedStress);
      setFatigue(newFatigue);

      const result: MockSimulationRoundResult = {
        roundIndex: currentRound,
        name: currentConfig.title.split(':')[0],
        fatigueLevel: newFatigue,
        scoreNet: roundNet,
        energySpent: energyUsed,
        actionTaken: paceAction,
      };

      const updatedResults = [...roundResults, result];
      setRoundResults(updatedResults);
      setIsProcessingRound(false);

      if (currentRound < 3) {
        sounds.playSuccess();
        setCurrentRound((currentRound + 1) as any);
      } else {
        // All 3 rounds complete!
        sounds.playSuccess();
        setIsCompleted(true);
      }
    }, 1000);
  };

  const handleFinishAndSave = () => {
    // Total net out of 120 questions
    const totalNet = roundResults.reduce((acc, r) => acc + r.scoreNet, 0);
    const avgFatigue = roundResults.reduce((acc, r) => acc + r.fatigueLevel, 0) / roundResults.length;
    
    // Endurance Bonus: Survived all 3 rounds with fatigue under control
    const enduranceBonus = avgFatigue < 60 ? 150 : 75;

    // Estimate rank for this 120-question mock marathon
    let estimatedRank = 85000;
    if (totalNet >= 105) estimatedRank = Math.round(Math.max(300, 2500 - (totalNet - 105) * 400));
    else if (totalNet >= 90) estimatedRank = Math.round(Math.max(3000, 15000 - (totalNet - 90) * 800));
    else if (totalNet >= 75) estimatedRank = Math.round(Math.max(16000, 45000 - (totalNet - 75) * 1800));
    else if (totalNet >= 60) estimatedRank = Math.round(Math.max(46000, 95000 - (totalNet - 60) * 3000));
    else estimatedRank = Math.round(Math.max(100000, 180000 - totalNet * 1000));

    const finalRecord: ExamRecord = {
      id: `mock_sim_${Date.now()}`,
      name: 'Simülasyon: 3\'lü Seri Gerçek Sınav Maratonu',
      dateStr: `${state.day}. Gün Simülasyon`,
      day: state.day,
      type: 'MOCK_SIMULATION',
      tytScore: {
        turkce: roundResults[0]?.scoreNet || 28,
        matematik: roundResults[1]?.scoreNet || 26,
        fen: (roundResults[2]?.scoreNet || 24) * 0.52,
        sosyal: (roundResults[2]?.scoreNet || 24) * 0.48,
        total: totalNet,
      },
      estimatedRank,
      isRecordScore: totalNet > state.currentTytEstimate,
      simulationDetails: {
        rounds: roundResults,
        overallScore: totalNet,
        enduranceBonus,
      },
    };

    onFinishSimulation(finalRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-4 shadow-2xl relative flex flex-col gap-3 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center font-bold">
              3x
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Gerçekçi Sınav Simülasyonu
              </h3>
              <p className="text-[10px] text-slate-400">
                Arka arkaya 3 mini-deneme & Dayanıklılık Yönetimi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Real-time Fatigue & Vital Gauges */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 grid grid-cols-3 gap-2 text-center">
          {/* Energy */}
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-[10px] text-amber-400 font-bold">
              <Zap className="w-3 h-3" />
              <span>Enerji</span>
            </div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              %{Math.round(sessionEnergy)}
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${sessionEnergy}%` }}
              />
            </div>
          </div>

          {/* Fatigue Level */}
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-[10px] text-rose-400 font-bold">
              <AlertTriangle className="w-3 h-3" />
              <span>Yorgunluk</span>
            </div>
            <div className="text-sm font-bold font-mono text-rose-300 mt-0.5">
              %{Math.round(fatigue)}
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${fatigue}%` }}
              />
            </div>
          </div>

          {/* Stress Level */}
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-[10px] text-purple-400 font-bold">
              <Heart className="w-3 h-3" />
              <span>Stres</span>
            </div>
            <div className="text-sm font-bold font-mono text-purple-300 mt-0.5">
              %{Math.round(sessionStress)}
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${sessionStress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3 Step Indicator Pills */}
        <div className="flex items-center gap-1.5">
          {roundsConfig.map(r => {
            const isPast = r.round < currentRound;
            const isCurrent = r.round === currentRound;
            const res = roundResults.find(res => res.roundIndex === r.round);

            return (
              <div
                key={r.round}
                className={`flex-1 p-2 rounded-xl border text-center transition-all ${
                  isCurrent && !isCompleted
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                    : isPast || isCompleted
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-bold">Oturum {r.round}</div>
                <div className="text-[9px] font-mono mt-0.5">
                  {res ? `${res.scoreNet.toFixed(1)} Net` : isCurrent ? 'Şimdi' : 'Bekliyor'}
                </div>
              </div>
            );
          })}
        </div>

        {!isCompleted ? (
          <>
            {/* Active Round Info Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                    AŞAMA {currentRound}/3
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1">
                    {currentConfig.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {currentConfig.subtitle}
                  </p>
                </div>
              </div>

              {/* Fatigue warning if high */}
              {fatigue >= 50 && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/70 border border-rose-500/40 text-[10px] text-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    Yüksek yorgunluk odaklanmayı zorlaştırıyor. Net düşüşü riskini azaltmak için taktiğini ayarla veya mola ver.
                  </span>
                </div>
              )}
            </div>

            {/* Fatigue Management Intermission (Quick Refuel) */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-slate-400 px-0.5 flex items-center justify-between">
                <span>Ara Dinlenme & Nefes Molası:</span>
                <span className="text-emerald-400">Yorgunluğu Azalt</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleQuickDrinkWater}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sky-300 text-[11px] font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <Coffee className="w-3 h-3 text-sky-400" />
                  <span>Su & Glukoz (-12 Yorgunluk)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeepBreath}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-purple-300 text-[11px] font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Derin Nefes (-12 Stres)</span>
                </button>
              </div>
            </div>

            {/* Strategy / Pace Selector for this Round */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-slate-400 px-0.5">
                Bu Oturumdaki Tempon:
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setRoundPace('CONSERVATIVE');
                  }}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    roundPace === 'CONSERVATIVE'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-bold">🛡️ Temkinli</div>
                  <div className="text-[8px] text-slate-400">Düşük yorgunluk</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setRoundPace('STEADY');
                  }}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    roundPace === 'STEADY'
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-bold">⚖️ Standart</div>
                  <div className="text-[8px] text-slate-400">Dengeli tempo</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setRoundPace('AGGRESSIVE');
                  }}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    roundPace === 'AGGRESSIVE'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-bold">⚡ Agresif</div>
                  <div className="text-[8px] text-slate-400">Yüksek risk/ödül</div>
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleExecuteRound}
              disabled={isProcessingRound || sessionEnergy < 5}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isProcessingRound ? (
                <>
                  <Timer className="w-4 h-4 animate-spin" />
                  <span>Sınav Çözülüyor... (%{roundProgress})</span>
                </>
              ) : (
                <>
                  <span>Oturum {currentRound}'i Çözmeye Başla</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        ) : (
          /* Marathon Completion Summary */
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-1">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-extrabold text-white">
                3'lü Sınav Simülasyonu Başarıyla Tamamlandı!
              </h4>
              <p className="text-[11px] text-emerald-200">
                Gerçek sınav baskısı ve yorgunluğa rağmen tüm 120 soruyu başarıyla tamamladın.
              </p>
            </div>

            {/* Total Results Grid */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Toplam Simülasyon Neti:</span>
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  {roundResults.reduce((acc, r) => acc + r.scoreNet, 0).toFixed(2)} / 120
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {roundResults.map(r => (
                  <div key={r.roundIndex} className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{r.name} ({r.actionTaken}):</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      {r.scoreNet.toFixed(1)} Net
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinishAndSave}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              Sonuçları Kaydet ve Ödülleri Al 🏆
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
