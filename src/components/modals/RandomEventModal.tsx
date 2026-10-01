import React from 'react';
import {
  Users,
  Coffee,
  MapPin,
  Tag,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Heart,
  GraduationCap,
  Quote,
  MessageSquare,
  EyeOff,
  X,
  Cpu,
} from 'lucide-react';
import { RandomEvent } from '../../types/game';
import { sounds } from '../../utils/audio';

interface RandomEventModalProps {
  event: RandomEvent;
  onChoose: (choiceIndex: number) => void;
  onIgnoreYahya?: (permanent?: boolean) => void;
  onClose?: () => void;
}

export const RandomEventModal: React.FC<RandomEventModalProps> = ({
  event,
  onChoose,
  onIgnoreYahya,
  onClose,
}) => {
  const renderIcon = (name: string) => {
    switch (name) {
      case 'Users': return <Users className="w-5 h-5 text-amber-400" />;
      case 'Coffee': return <Coffee className="w-5 h-5 text-orange-400" />;
      case 'MapPin': return <MapPin className="w-5 h-5 text-sky-400" />;
      case 'Tag': return <Tag className="w-5 h-5 text-emerald-400" />;
      case 'Heart': return <Heart className="w-5 h-5 text-rose-400" />;
      case 'AlertCircle': return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-cyan-400" />;
      default: return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`bg-slate-900 border rounded-2xl max-w-sm w-full p-4 shadow-2xl relative flex flex-col gap-3 overflow-hidden ${
        event.isYahyaHoca ? 'border-amber-500/60 ring-1 ring-amber-500/30' : 'border-slate-700/80'
      }`}>
        {/* Decorative Top Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          event.isYahyaHoca
            ? 'bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400'
            : 'bg-gradient-to-r from-sky-400 to-indigo-500'
        }`} />

        {/* Header Tag */}
        <div className="flex items-center justify-between pt-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${
            event.isYahyaHoca
              ? 'text-amber-300 bg-amber-500/20 border-amber-500/40'
              : 'text-sky-300 bg-sky-500/20 border-sky-500/30'
          }`}>
            {event.isYahyaHoca && <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />}
            {event.tag}
          </span>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            {renderIcon(event.icon)}
          </div>
        </div>

        {/* Special Yahya Hoca & Yeliz Profile Box */}
        {event.isYahyaHoca && (
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-2.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-sm font-bold">
                  📐
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Yahya Hoca & Yeliz</span>
                    <span className="text-[9px] text-rose-400 bg-rose-500/10 px-1 rounded border border-rose-500/20">Sevgililer</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Peltek Matematik Öğretmeni & Öğrencisi</div>
                </div>
              </div>
            </div>

            {event.characterQuote && (
              <div className="flex items-start gap-1.5 bg-amber-950/40 border border-amber-500/20 rounded-lg p-2 text-[11px] text-amber-200 italic leading-snug">
                <Quote className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{event.characterQuote}</span>
              </div>
            )}
          </div>
        )}

        {/* Title & Description */}
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">{event.title}</h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Choices */}
        <div className="space-y-2 mt-1">
          {event.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => {
                sounds.playTap();
                onChoose(idx);
              }}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-800/80 text-left transition-all active:scale-98 flex items-center justify-between group cursor-pointer"
            >
              <div className="pr-2">
                <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                  {choice.text}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {choice.description}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0 ml-1" />
            </button>
          ))}
        </div>

        {/* Görmezden Gel Option for Yahya Hoca Events */}
        {event.isYahyaHoca && onIgnoreYahya && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                onIgnoreYahya(false); // Sadece bu olayı kapat/görmezden gel
              }}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Şimdilik Görmezden Gel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                onIgnoreYahya(true); // Yahya Hoca olaylarını tamamen kapat
              }}
              title="Bir daha Yahya Hoca olayları çıkmasın (Oda ayarlarından tekrar açılabilir)"
              className="py-1.5 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-900/60 text-[10px] font-bold text-rose-300 transition-colors cursor-pointer"
            >
              Tamamen Gizle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
