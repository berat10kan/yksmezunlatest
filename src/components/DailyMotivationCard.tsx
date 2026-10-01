import React, { useState } from 'react';
import { Sparkles, Quote, RefreshCw, Flame, Check } from 'lucide-react';
import { MOTIVATION_QUOTES, MotivationQuote } from '../data/motivationQuotes';
import { sounds } from '../utils/audio';

interface DailyMotivationCardProps {
  onBoostMorale: (amount: number) => void;
  currentMorale: number;
}

export const DailyMotivationCard: React.FC<DailyMotivationCardProps> = ({
  onBoostMorale,
}) => {
  // Random initial quote
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * MOTIVATION_QUOTES.length)
  );
  const [justBoosted, setJustBoosted] = useState(false);
  const [floatingBonus, setFloatingBonus] = useState<{ id: number; text: string } | null>(null);

  const currentQuote: MotivationQuote = MOTIVATION_QUOTES[quoteIndex] || MOTIVATION_QUOTES[0];

  const handleNextQuote = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playTap();
    setQuoteIndex(prev => {
      let next = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
      if (next === prev && MOTIVATION_QUOTES.length > 1) {
        next = (prev + 1) % MOTIVATION_QUOTES.length;
      }
      return next;
    });
  };

  const handleClaimMotivation = (e: React.MouseEvent) => {
    sounds.playRelax();
    const bonus = currentQuote.moraleBonus || 6;
    onBoostMorale(bonus);

    setJustBoosted(true);
    setFloatingBonus({
      id: Date.now(),
      text: `+${bonus} Moral ✨`,
    });

    setTimeout(() => {
      setFloatingBonus(null);
    }, 1200);

    setTimeout(() => {
      setJustBoosted(false);
    }, 2500);
  };

  const getCategoryBadge = (category: MotivationQuote['category']) => {
    switch (category) {
      case 'CAMPUS_DREAM':
        return { label: '🎓 Kampüs Hayali', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' };
      case 'RESILIENCE':
        return { label: '🛡️ Mezun İnadı', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
      case 'DISCIPLINE':
        return { label: '⚡ Demir Disiplin', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' };
      case 'YKS_WISDOM':
        return { label: '🧠 Hoca Tavsiyesi', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
      default:
        return { label: '🔥 Odak & Hedef', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
    }
  };

  const badge = getCategoryBadge(currentQuote.category);

  return (
    <div
      onClick={handleClaimMotivation}
      className="relative overflow-hidden rounded-xl border border-amber-500/35 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/20 p-3 shadow-md hover:border-amber-400/60 transition-all cursor-pointer group active:scale-[0.99]"
    >
      {/* Background Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

      {/* Floating Morale Gained Popup */}
      {floatingBonus && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-bounce font-bold font-mono text-sm text-amber-300 bg-slate-950/90 border border-amber-400/60 px-3 py-1 rounded-full shadow-xl">
          {floatingBonus.text}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sparkles className="w-3 h-3 animate-pulse" />
          </div>
          <span className="text-[11px] font-bold tracking-tight text-amber-300 uppercase flex items-center gap-1">
            Günün Mezun Motivasyonu
          </span>
          <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded border ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        <button
          onClick={handleNextQuote}
          title="Farklı Bir Motivasyon Sözü Getir"
          className="w-6 h-6 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
        >
          <RefreshCw className="w-3 h-3 group-hover:rotate-45 transition-transform duration-300" />
        </button>
      </div>

      {/* Quote Body */}
      <div className="relative pl-3.5 border-l-2 border-amber-400/50 my-1.5">
        <Quote className="absolute -left-2 -top-1.5 w-3.5 h-3.5 text-amber-400/30" />
        <p className="text-xs text-slate-200 leading-snug font-medium italic">
          "{currentQuote.quote}"
        </p>
        <span className="block text-[10px] text-amber-400/80 font-semibold mt-1">
          — {currentQuote.author}
        </span>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
        <span className="text-slate-400 flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-400" />
          <span>Tıkla ve Morali Yükselt</span>
        </span>

        <span className={`font-bold flex items-center gap-1 transition-colors ${
          justBoosted ? 'text-emerald-400' : 'text-amber-400 group-hover:text-amber-300'
        }`}>
          {justBoosted ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Moral Yüklendi!</span>
            </>
          ) : (
            <span>+{currentQuote.moraleBonus} Moral Kazan</span>
          )}
        </span>
      </div>
    </div>
  );
};
