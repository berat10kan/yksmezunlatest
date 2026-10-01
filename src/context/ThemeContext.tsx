import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ColorThemeMode, MusicGenre } from '../types/game';
import { MUSIC_BUFFS } from '../data/musicData';

export interface ThemeColors {
  primary: string;           // Base primary color (e.g. #34d399, #f43f5e)
  primaryRgb: string;        // RGB numbers for rgba usage (e.g. "52, 211, 153")
  accent: string;            // Glowing accent text/border color
  accentRgb: string;         // RGB numbers for accent
  bgGradient: string;        // Tailwind gradient classes or background style
  cardBorder: string;        // Tailwind border class or custom hex border
  glowShadow: string;        // Box shadow glow style
  badgeBg: string;           // Background color for badges
  tagline: string;           // Genre atmosphere description
  genreName: string;
  genreBadge: string;
}

export interface ThemeContextValue {
  genre: MusicGenre;
  setGenre: (genre: MusicGenre) => void;
  colors: ThemeColors;
  themeStyle: React.CSSProperties;
  mode: ColorThemeMode;
  resolvedMode: 'dark' | 'light';
  setMode: (mode: ColorThemeMode) => void;
}

// Convert 6-character or 3-character hex color to "r, g, b"
function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return '16, 185, 129'; // emerald fallback
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export const GENRE_PALETTES: Record<MusicGenre, { primary: string; accent: string }> = {
  CLASSICAL: {
    primary: '#a855f7',
    accent: '#c084fc',
  },
  METAL_ROCK: {
    primary: '#e11d48',
    accent: '#f43f5e',
  },
  ROCK_TRAP: {
    primary: '#e11d48',
    accent: '#f43f5e',
  },
  LO_FI: {
    primary: '#10b981',
    accent: '#34d399',
  },
  RAP_TRAP: {
    primary: '#f59e0b',
    accent: '#fbbf24',
  },
  POP_DANCE: {
    primary: '#06b6d4',
    accent: '#22d3ee',
  },
  POP_ENERGY: {
    primary: '#06b6d4',
    accent: '#22d3ee',
  },
  TURKISH_NOSTALGIA: {
    primary: '#d97706',
    accent: '#fbbf24',
  },
  JAZZ_ACOUSTIC: {
    primary: '#ca8a04',
    accent: '#fde047',
  },
  PHONK_DRIFT: {
    primary: '#9333ea',
    accent: '#c084fc',
  },
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{
  currentGenre?: MusicGenre;
  colorTheme?: ColorThemeMode;
  onThemeChange?: (mode: ColorThemeMode) => void;
  children: React.ReactNode;
}> = ({ currentGenre = 'LO_FI', colorTheme = 'DARK', onThemeChange, children }) => {
  const [genre, setGenre] = useState<MusicGenre>(currentGenre);
  const [mode, setModeState] = useState<ColorThemeMode>(colorTheme);

  // Sync when prop updates
  useEffect(() => {
    if (currentGenre) {
      setGenre(currentGenre);
    }
  }, [currentGenre]);

  useEffect(() => {
    if (colorTheme) {
      setModeState(colorTheme);
    }
  }, [colorTheme]);

  // System preference detection
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedMode: 'dark' | 'light' = useMemo(() => {
    if (mode === 'DARK') return 'dark';
    if (mode === 'LIGHT') return 'light';
    return systemIsDark ? 'dark' : 'light';
  }, [mode, systemIsDark]);

  const setMode = (newMode: ColorThemeMode) => {
    setModeState(newMode);
    if (onThemeChange) {
      onThemeChange(newMode);
    }
  };

  const buff = MUSIC_BUFFS[genre] || MUSIC_BUFFS.LO_FI;
  const palette = GENRE_PALETTES[genre] || GENRE_PALETTES.LO_FI;

  const colors = useMemo<ThemeColors>(() => {
    const primaryHex = buff.theme?.accentColor || palette.primary;
    const accentHex = palette.accent;
    const primaryRgb = hexToRgb(primaryHex);
    const accentRgb = hexToRgb(accentHex);

    return {
      primary: primaryHex,
      primaryRgb,
      accent: accentHex,
      accentRgb,
      bgGradient: buff.theme?.bgGradient || 'from-slate-950 via-slate-900 to-black',
      cardBorder: buff.theme?.cardBorder || 'border-slate-800',
      glowShadow: buff.theme?.glowShadow || 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      badgeBg: `${primaryHex}20`,
      tagline: buff.theme?.tagline || buff.description,
      genreName: buff.name,
      genreBadge: buff.badge,
    };
  }, [genre, buff, palette]);

  // Inject CSS Variables & class to <html> / documentElement
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', colors.primary);
    root.style.setProperty('--bg-primary-rgb', colors.primaryRgb);
    root.style.setProperty('--text-accent', colors.accent);
    root.style.setProperty('--text-accent-rgb', colors.accentRgb);
    root.style.setProperty('--theme-glow', colors.primary ? `${colors.primary}40` : 'rgba(16,185,129,0.25)');
    root.style.setProperty('--theme-border', `${colors.primary}60`);

    if (resolvedMode === 'light') {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
      root.style.colorScheme = 'light';
    } else {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
      root.style.colorScheme = 'dark';
    }
  }, [colors, resolvedMode]);

  const themeStyle = useMemo<React.CSSProperties>(() => {
    return {
      '--bg-primary': colors.primary,
      '--bg-primary-rgb': colors.primaryRgb,
      '--text-accent': colors.accent,
      '--text-accent-rgb': colors.accentRgb,
    } as React.CSSProperties;
  }, [colors]);

  return (
    <ThemeContext.Provider value={{ genre, setGenre, colors, themeStyle, mode, resolvedMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useMusicTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const palette = GENRE_PALETTES.LO_FI;
    return {
      genre: 'LO_FI',
      setGenre: () => {},
      colors: {
        primary: palette.primary,
        primaryRgb: hexToRgb(palette.primary),
        accent: palette.accent,
        accentRgb: hexToRgb(palette.accent),
        bgGradient: 'from-slate-950 via-teal-950/60 to-emerald-950/50',
        cardBorder: 'border-emerald-500/40',
        glowShadow: 'shadow-[0_0_35px_rgba(16,185,129,0.22)]',
        badgeBg: `${palette.primary}20`,
        tagline: 'Yağmurlu Pencere • Pastel Huzur & Yumuşak Beatler',
        genreName: 'Lo-Fi & Chillhop',
        genreBadge: 'Stres Kalkanı',
      },
      themeStyle: {},
      mode: 'DARK',
      resolvedMode: 'dark',
      setMode: () => {},
    };
  }
  return ctx;
};
