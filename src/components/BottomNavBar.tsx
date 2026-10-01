import React from 'react';
import {
  Home,
  FileCheck2,
  ShoppingBag,
  MessageCircle,
  Heart,
  Target,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export type ActiveTab = 'ROOM' | 'EXAMS' | 'SHOP' | 'SOCIAL' | 'STRESS' | 'GOAL';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  stressLevel: number;
  hasUnreadSocial: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  stressLevel,
  hasUnreadSocial,
}) => {
  const tabs = [
    { id: 'ROOM', label: 'Oda', icon: Home },
    { id: 'EXAMS', label: 'Deneme', icon: FileCheck2 },
    { id: 'SHOP', label: 'Mağaza', icon: ShoppingBag },
    { id: 'SOCIAL', label: 'YKS Gram', icon: MessageCircle, badge: hasUnreadSocial },
    { id: 'STRESS', label: 'Stres', icon: Heart, alert: stressLevel >= 75 },
    { id: 'GOAL', label: 'Hedef', icon: Target },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1">
      <div className="grid grid-cols-6 items-center h-14">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playTap();
                onTabChange(tab.id as ActiveTab);
              }}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-all relative ${
                isActive
                  ? 'text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                )}
                {tab.alert && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-bounce" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-[50px] ${
                isActive ? 'text-sky-400 font-bold' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
