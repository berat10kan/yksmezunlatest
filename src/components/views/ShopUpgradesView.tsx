import React, { useState } from 'react';
import {
  ShoppingBag,
  Armchair,
  Headphones,
  Coffee,
  Presentation,
  BookOpen,
  Library,
  FileCheck,
  Building,
  Compass,
  Pill,
  HeartHandshake,
  Check,
  Zap,
} from 'lucide-react';
import { GameSaveState, UpgradeItem } from '../../types/game';
import { UPGRADE_ITEMS, DIFFICULTY_CONFIGS } from '../../data/initialData';
import { sounds } from '../../utils/audio';

interface ShopUpgradesViewProps {
  state: GameSaveState;
  onBuyUpgrade: (upgradeId: string, cost: number) => void;
}

export const ShopUpgradesView: React.FC<ShopUpgradesViewProps> = ({
  state,
  onBuyUpgrade,
}) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'ROOM' | 'BOOKS' | 'COACHING' | 'WELLNESS'>('ALL');
  const difficulty = state.difficulty || 'BALANCED';
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const difficultyCostMultiplier = diffConfig ? diffConfig.costMultiplier : 1.0;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Armchair': return <Armchair className="w-5 h-5 text-amber-400" />;
      case 'Headphones': return <Headphones className="w-5 h-5 text-indigo-400" />;
      case 'Coffee': return <Coffee className="w-5 h-5 text-orange-400" />;
      case 'Presentation': return <Presentation className="w-5 h-5 text-sky-400" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'Library': return <Library className="w-5 h-5 text-purple-400" />;
      case 'FileCheck': return <FileCheck className="w-5 h-5 text-cyan-400" />;
      case 'Building': return <Building className="w-5 h-5 text-blue-400" />;
      case 'Compass': return <Compass className="w-5 h-5 text-rose-400" />;
      case 'Pill': return <Pill className="w-5 h-5 text-pink-400" />;
      case 'HeartHandshake': return <HeartHandshake className="w-5 h-5 text-teal-400" />;
      default: return <ShoppingBag className="w-5 h-5 text-slate-400" />;
    }
  };

  const getUpgradeCost = (item: UpgradeItem, currentLevel: number) => {
    const rawCost = item.baseCost * Math.pow(item.costMultiplier, currentLevel);
    return Math.round(rawCost * difficultyCostMultiplier);
  };

  const filteredItems = UPGRADE_ITEMS.filter(item => {
    if (activeCategory === 'ALL') return true;
    return item.category === activeCategory;
  });

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Shop Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold flex-wrap">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Mezun Tycoon Mağazası</span>
            {diffConfig && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border"
                style={{
                  backgroundColor: `${diffConfig.color}20`,
                  borderColor: `${diffConfig.color}40`,
                  color: diffConfig.color,
                }}
              >
                {diffConfig.name} ({diffConfig.costMultiplier}x Fiyat)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Odanı donat, pasif soru çözme hızı ve net avantajı kazan.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400">Kullanılabilir Bütçe</span>
          <div className="text-base font-bold font-mono text-emerald-400">
            ₺{Math.floor(state.money)}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'ALL', label: 'Tümü' },
          { id: 'ROOM', label: 'Oda & Ekipman' },
          { id: 'BOOKS', label: 'Kitap & Arşiv' },
          { id: 'COACHING', label: 'Kütüphane & Koçluk' },
          { id: 'WELLNESS', label: 'Sağlık & Odak' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              sounds.playTap();
              setActiveCategory(tab.id as typeof activeCategory);
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upgrade Item List */}
      <div className="space-y-2">
        {filteredItems.map(item => {
          const currentLevel = state.upgrades[item.id] || 0;
          const isMaxed = currentLevel >= item.maxLevel;
          const cost = getUpgradeCost(item, currentLevel);
          const canAfford = state.money >= cost && !isMaxed;

          return (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 hover:border-slate-700/80 transition-all flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
                    {renderIcon(item.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                        Sv. {currentLevel}/{item.maxLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits and purchase row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-sky-300 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-sky-400" />
                  {item.benefitText}
                </span>

                <button
                  onClick={() => {
                    sounds.playCoin();
                    onBuyUpgrade(item.id, cost);
                  }}
                  disabled={!canAfford}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all active:scale-95 ${
                    isMaxed
                      ? 'bg-slate-800 text-slate-500 cursor-default border border-slate-700'
                      : canAfford
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md border border-emerald-400/40 cursor-pointer'
                      : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                  }`}
                >
                  {isMaxed ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> MAKS
                    </span>
                  ) : (
                    <span>₺{cost.toLocaleString('tr-TR')}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
