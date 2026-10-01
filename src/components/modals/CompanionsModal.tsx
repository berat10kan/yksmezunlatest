import React, { useState } from 'react';
import {
  Users,
  X,
  Heart,
  Sparkles,
  Coffee,
  HelpCircle,
  BookOpen,
  Flame,
  MessageCircle,
  Utensils,
  Footprints,
  Music,
  HeartHandshake,
  CheckCircle2,
  TrendingUp,
  Zap,
  Crown,
  Compass,
  ClipboardList,
  Headphones,
  Gamepad2,
  Scroll,
  Smile,
  GraduationCap,
  Code,
  Smartphone,
  Award,
  Cpu,
} from 'lucide-react';
import { CharacterInteraction, GameSaveState } from '../../types/game';
import { COMPANION_CHARACTERS } from '../../data/charactersData';
import { sounds } from '../../utils/audio';

interface CompanionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameSaveState;
  onPerformAction: (
    characterId: string,
    actionId: string,
    outcome: CharacterInteraction['actions'][0]['outcome'],
    energyCost: number,
    moneyCost: number
  ) => void;
}

export const CompanionsModal: React.FC<CompanionsModalProps> = ({
  isOpen,
  onClose,
  state,
  onPerformAction,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'friends'>('all');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('char_zehra');
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCharacters = COMPANION_CHARACTERS.filter(char => {
    if (activeTab === 'staff') return char.category === 'staff';
    if (activeTab === 'friends') return char.category === 'friend';
    return true;
  });

  const selectedChar = COMPANION_CHARACTERS.find(c => c.id === selectedCharacterId) || COMPANION_CHARACTERS[0];
  const userRelLevel = state.characterRelationships?.[selectedChar.id] ?? selectedChar.relationshipLevel;

  const getRelationshipStatus = (level: number) => {
    if (level >= 80) return { title: 'Kader Ortağı & Sırdaş', color: 'text-amber-400', progress: 'bg-amber-400' };
    if (level >= 50) return { title: 'Çok Yakın Dost', color: 'text-emerald-400', progress: 'bg-emerald-400' };
    if (level >= 25) return { title: 'Samimi Arkadaş', color: 'text-sky-400', progress: 'bg-sky-400' };
    return { title: 'Kütüphane Tanışıklığı', color: 'text-slate-400', progress: 'bg-slate-400' };
  };

  const relInfo = getRelationshipStatus(userRelLevel);

  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee': return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'HelpCircle': return <HelpCircle className="w-4 h-4 text-sky-400" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'Flame': return <Flame className="w-4 h-4 text-rose-400" />;
      case 'MessageCircle': return <MessageCircle className="w-4 h-4 text-indigo-400" />;
      case 'Utensils': return <Utensils className="w-4 h-4 text-amber-400" />;
      case 'Footprints': return <Footprints className="w-4 h-4 text-emerald-400" />;
      case 'Music': return <Music className="w-4 h-4 text-pink-400" />;
      case 'HeartHandshake': return <HeartHandshake className="w-4 h-4 text-rose-400" />;
      case 'Heart': return <Heart className="w-4 h-4 text-rose-400" />;
      case 'Crown': return <Crown className="w-4 h-4 text-amber-400" />;
      case 'Compass': return <Compass className="w-4 h-4 text-rose-400" />;
      case 'ClipboardList': return <ClipboardList className="w-4 h-4 text-indigo-400" />;
      case 'Headphones': return <Headphones className="w-4 h-4 text-purple-400" />;
      case 'Gamepad2': return <Gamepad2 className="w-4 h-4 text-blue-400" />;
      case 'Scroll': return <Scroll className="w-4 h-4 text-orange-400" />;
      case 'Smile': return <Smile className="w-4 h-4 text-pink-400" />;
      case 'GraduationCap': return <GraduationCap className="w-4 h-4 text-teal-400" />;
      case 'Code': return <Code className="w-4 h-4 text-violet-400" />;
      case 'Smartphone': return <Smartphone className="w-4 h-4 text-orange-400" />;
      default: return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  const handleExecute = (action: CharacterInteraction['actions'][0]) => {
    if (state.energy < action.energyCost) {
      sounds.playStressAlert();
      setLastActionResult('❌ Yetersiz Enerji! Biraz dinlenmeli veya kahve içmelisin.');
      return;
    }

    if (action.moneyCost > 0 && state.money < action.moneyCost) {
      sounds.playStressAlert();
      setLastActionResult(`❌ Yetersiz Bakiye! Bu aksiyon için ${action.moneyCost}₺ gerekiyor.`);
      return;
    }

    sounds.playSuccess();
    setLastActionResult(action.outcome.message);
    onPerformAction(
      selectedChar.id,
      action.id,
      action.outcome,
      action.energyCost,
      action.moneyCost
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Kütüphane Sosyal Çevre & Dostlar</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                  {COMPANION_CHARACTERS.length} Karakter
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Ablalar (Zehra, Arife, Türkan) ve kütüphane arkadaşlarınla etkileşime gir!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Switcher */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800/80 text-xs">
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('all');
            }}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Hepsi ({COMPANION_CHARACTERS.length})
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('staff');
            }}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'staff'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>🧹 Temizlik Ekibi (3)</span>
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('friends');
            }}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'friends'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>📚 Kütüphane Arkadaşları ({COMPANION_CHARACTERS.filter(c => c.category === 'friend').length})</span>
          </button>
        </div>

        {/* Character Selector Horizontal Scroll / Grid */}
        <div className="p-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {filteredCharacters.map(char => {
            const isSelected = char.id === selectedCharacterId;
            const currentLvl = state.characterRelationships?.[char.id] ?? char.relationshipLevel;

            return (
              <button
                key={char.id}
                onClick={() => {
                  sounds.playTap();
                  setSelectedCharacterId(char.id);
                  setLastActionResult(null);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border whitespace-nowrap shrink-0 text-left ${
                  isSelected
                    ? 'bg-slate-800 border-sky-500 shadow-md ring-1 ring-sky-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: char.color }}
                >
                  {char.avatarIcon === 'Crown' ? <Crown className="w-3.5 h-3.5 text-amber-300" /> :
                   char.avatarIcon === 'GraduationCap' ? <GraduationCap className="w-3.5 h-3.5" /> :
                   char.avatarIcon === 'Compass' ? <Compass className="w-3.5 h-3.5" /> :
                   char.avatarIcon === 'ClipboardList' ? <ClipboardList className="w-3.5 h-3.5" /> :
                   char.avatarIcon === 'Headphones' ? <Headphones className="w-3.5 h-3.5" /> :
                   char.avatarIcon === 'Gamepad2' ? <Gamepad2 className="w-3.5 h-3.5" /> :
                   char.avatarIcon === 'Scroll' ? <Scroll className="w-3.5 h-3.5" /> :
                   char.avatarIcon === 'Coffee' ? <Coffee className="w-3.5 h-3.5" /> :
                   char.avatarIcon === 'HeartHandshake' ? <HeartHandshake className="w-3.5 h-3.5" /> :
                   char.avatarIcon === 'Cpu' ? <Cpu className="w-3.5 h-3.5" /> :
                   <Smile className="w-3.5 h-3.5" />}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white">{char.name}</span>
                    {char.id === 'char_zehra' && (
                      <span className="text-[9px] px-1 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/50">
                        ★ Favori
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span className="font-mono text-amber-300 flex items-center gap-0.5">
                      <Heart className="w-2 h-2 fill-rose-500 text-rose-500" />
                      %{currentLvl}
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[85px]">{char.nickname}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-3.5">
          {/* Character Highlight Profile */}
          <div
            className="p-3.5 rounded-2xl border transition-all"
            style={{
              backgroundColor: `${selectedChar.color}10`,
              borderColor: `${selectedChar.color}40`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>{selectedChar.name}</span>
                    {selectedChar.id === 'char_zehra' && (
                      <span className="text-xs text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/50">
                        👑 Baş Tacı
                      </span>
                    )}
                  </h3>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                    style={{
                      backgroundColor: `${selectedChar.color}20`,
                      borderColor: `${selectedChar.color}60`,
                      color: selectedChar.color,
                    }}
                  >
                    {selectedChar.badge}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedChar.category === 'staff' ? '🧹 Temizlik Ekibi' : '📚 Kütüphane Arkadaşı'}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-300 mt-1">{selectedChar.nickname}</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {selectedChar.description}
                </p>
              </div>
            </div>

            {/* Relationship Bar */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span className="text-slate-300 font-medium">Samimiyet / Dostluk Bağı:</span>
                <span className={`font-bold ${relInfo.color}`}>{relInfo.title}</span>
              </div>
              <span className="font-mono font-bold text-white">%{userRelLevel}</span>
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${relInfo.progress}`}
                style={{ width: `${Math.min(100, userRelLevel)}%` }}
              />
            </div>

            <div className="mt-2 text-[10px] text-slate-300 flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{selectedChar.perkSummary}</span>
            </div>
          </div>

          {/* Action Result Toast */}
          {lastActionResult && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-start gap-2 animate-fade-in shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{lastActionResult}</p>
            </div>
          )}

          {/* Character Action List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between px-1">
              <span>{selectedChar.name} ile Yapılabilecek Aksiyonlar</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Enerji: {Math.round(state.energy)}⚡ | Bakiye: {state.money}₺
              </span>
            </h4>

            <div className="grid grid-cols-1 gap-2">
              {selectedChar.actions.map(action => {
                const canAffordEnergy = state.energy >= action.energyCost;
                const canAffordMoney = state.money >= action.moneyCost;
                const canExecute = canAffordEnergy && canAffordMoney;

                return (
                  <div
                    key={action.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          {getActionIcon(action.icon)}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{action.name}</span>
                          </h5>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1 flex-wrap gap-2">
                      {/* Cost & Reward Badges */}
                      <div className="flex items-center gap-1.5 text-[10px] font-mono flex-wrap">
                        {action.energyCost > 0 ? (
                          <span className={`px-1.5 py-0.5 rounded ${canAffordEnergy ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40' : 'bg-rose-950 text-rose-300'}`}>
                            -{action.energyCost}⚡
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                            0⚡ Ücretsiz
                          </span>
                        )}

                        {action.moneyCost > 0 && (
                          <span className={`px-1.5 py-0.5 rounded ${canAffordMoney ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' : 'bg-rose-950 text-rose-300'}`}>
                            -{action.moneyCost}₺
                          </span>
                        )}

                        <span className="text-rose-400 text-[10px] flex items-center gap-0.5 font-sans font-medium">
                          +{action.outcome.relationshipGain} Samimiyet
                        </span>

                        {action.outcome.bp && (
                          <span className="text-sky-400 text-[10px] font-sans font-medium">
                            +{action.outcome.bp} BP
                          </span>
                        )}

                        {action.outcome.fenBonus && (
                          <span className="text-teal-400 text-[10px] font-sans font-medium">
                            +{action.outcome.fenBonus} Fen
                          </span>
                        )}

                        {action.outcome.sosyalBonus && (
                          <span className="text-orange-400 text-[10px] font-sans font-medium">
                            +{action.outcome.sosyalBonus} Sosyal
                          </span>
                        )}
                      </div>

                      {/* Action Trigger Button */}
                      <button
                        type="button"
                        onClick={() => handleExecute(action)}
                        disabled={!canExecute}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          canExecute
                            ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>Aksiyonu Yap</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
