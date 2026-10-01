import React from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Award,
} from 'lucide-react';

export type DeskTier = 'MESSY' | 'ORGANIZED' | 'PROFESSIONAL';

export interface DeskTierInfo {
  tier: DeskTier;
  level: number;
  title: string;
  badge: string;
  description: string;
  bgGlow: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  perks: string[];
}

export function getLibraryDeskTier(libraryLevel: number): DeskTierInfo {
  if (libraryLevel <= 0) {
    return {
      tier: 'MESSY',
      level: 0,
      title: 'Dağınık Mezun Masası',
      badge: 'Seviye 0: Dağınık & Kaotik',
      description: 'Her yana saçılmış test yaprakları, yarım içilmiş soğuk kahve kupası, yıpranmış silgiler ve kayıp formül kağıtları...',
      bgGlow: 'rgba(239, 68, 68, 0.15)',
      borderColor: '#ef4444',
      badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
      badgeText: 'text-rose-400',
      perks: [
        'Zihin yorgunluğu ve hafif odak dağılması',
        'Kütüphane kartı alarak düzenli ortama geçebilirsin',
      ],
    };
  }

  if (libraryLevel <= 2) {
    return {
      tier: 'ORGANIZED',
      level: libraryLevel,
      title: 'Düzenli Kütüphane Masası',
      badge: `Seviye ${libraryLevel}: Düzenli & Odaklı`,
      description: 'Zehra Abla\'nın temizlediği lekesiz masa, dik duran soru bankası rafları, renkli fosforlu kalemler ve sıcak termos kupa.',
      bgGlow: 'rgba(56, 189, 248, 0.20)',
      borderColor: '#38bdf8',
      badgeBg: 'bg-sky-500/20 border-sky-500/40 text-sky-300',
      badgeText: 'text-sky-400',
      perks: [
        '+%15 Pomodoro soru çözme hızı',
        'Zehra Abla ve kütüphane ekibi desteği',
        `Günlük +${libraryLevel * 50}₺ harçlık desteği`,
      ],
    };
  }

  return {
    tier: 'PROFESSIONAL',
    level: libraryLevel,
    title: 'Profesyonel VIP Etüt Odası',
    badge: `Seviye ${libraryLevel}: VIP Şampiyon Masası`,
    description: 'Özel deri masa pedi, çift katmanlı LED okuma lambası, kronometre saati, Türkiye geneli deneme arşivi ve tam sessizlik kalkanı.',
    bgGlow: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#f59e0b',
    badgeBg: 'bg-amber-500/25 border-amber-500/50 text-amber-200',
    badgeText: 'text-amber-400',
    perks: [
      'Maksimum Flow-State odaklanma aurası',
      'Saniyede +3.0 pasif BP geliri',
      `Günlük +${libraryLevel * 50}₺ harçlık desteği`,
      'Stres artışında %20 doğal direnç',
    ],
  };
}

interface DeskVisualLayerProps {
  libraryLevel: number;
  isStudying?: boolean;
}

export const DeskVisualLayer: React.FC<DeskVisualLayerProps> = ({
  libraryLevel,
  isStudying,
}) => {
  const deskInfo = getLibraryDeskTier(libraryLevel);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex flex-col justify-end">
      {/* Subtle Ambient Floor / Desk Reflection Glow without blocking room image */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 opacity-60 transition-all duration-700 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${deskInfo.bgGlow} 0%, transparent 100%)`,
        }}
      />
    </div>
  );
};
