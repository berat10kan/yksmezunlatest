import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Maximize2, Minimize2, Moon, Sun, Laptop } from 'lucide-react';
import { sounds } from '../utils/audio';
import { useMusicTheme } from '../context/ThemeContext';
import { ColorThemeMode } from '../types/game';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  // Automatically detect if user is on a mobile device or small screen
  const [isPhoneMode, setIsPhoneMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return true;
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const { colors, mode, setMode } = useMusicTheme();

  const handleCycleTheme = () => {
    sounds.playTap();
    const nextMode: ColorThemeMode =
      mode === 'DARK' ? 'LIGHT' : mode === 'LIGHT' ? 'SYSTEM' : 'DARK';
    setMode(nextMode);
  };

  // Auto-adapt on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsPhoneMode(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleFullscreen = () => {
    sounds.playTap();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start sm:py-4 sm:px-2 font-sans select-none relative overflow-x-hidden">
      {/* Dynamic Background Atmosphere Glow from detected music */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 opacity-20 -z-0"
        style={{
          background: `radial-gradient(ellipse at 50% 10%, rgba(var(--bg-primary-rgb), 0.35) 0%, transparent 70%)`,
        }}
      />

      {/* Desktop floating mode switcher & Fullscreen button */}
      <div className="hidden sm:flex items-center gap-2 mb-2 bg-slate-900/90 border border-slate-800 rounded-full px-3 py-1 shadow-md text-xs text-slate-400 relative z-20 backdrop-blur-xs">
        <span className="font-semibold text-slate-300">Görünüm:</span>
        <button
          onClick={() => {
            sounds.playTap();
            setIsPhoneMode(true);
          }}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
            isPhoneMode ? 'bg-sky-600 text-white font-medium shadow-xs' : 'hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3 h-3" />
          <span>Mobil Telefon</span>
        </button>
        <button
          onClick={() => {
            sounds.playTap();
            setIsPhoneMode(false);
          }}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
            !isPhoneMode ? 'bg-sky-600 text-white font-medium shadow-xs' : 'hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3 h-3" />
          <span>Tam Ekran / Geniş</span>
        </button>

        <div className="w-px h-3.5 bg-slate-700 mx-1" />

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tarayıcıyı Tam Ekran Yap'}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3 text-amber-400" /> : <Maximize2 className="w-3 h-3 text-sky-400" />}
          <span>{isFullscreen ? 'Pencere' : 'Tam Ekran'}</span>
        </button>

        <div className="w-px h-3.5 bg-slate-700 mx-1" />

        {/* Theme mode switcher button */}
        <button
          onClick={handleCycleTheme}
          title={`Tema: ${mode === 'DARK' ? 'Karanlık Mod' : mode === 'LIGHT' ? 'Aydınlık Mod' : 'Sistem Modu'} (Değiştirmek İçin Tıkla)`}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {mode === 'DARK' && (
            <>
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Karanlık</span>
            </>
          )}
          {mode === 'LIGHT' && (
            <>
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Aydınlık</span>
            </>
          )}
          {mode === 'SYSTEM' && (
            <>
              <Laptop className="w-3 h-3 text-sky-400" />
              <span>Sistem</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container - Automatically scales: on mobile screen it fills 100% viewport */}
      <div
        className={`w-full bg-slate-950 transition-all duration-300 relative flex flex-col z-10 ${
          isPhoneMode
            ? 'w-full sm:max-w-[430px] sm:rounded-[36px] sm:border-4 sm:border-slate-800 min-h-screen sm:min-h-[860px] overflow-hidden'
            : 'w-full max-w-4xl sm:rounded-2xl sm:border border-slate-800 shadow-2xl min-h-screen overflow-hidden'
        }`}
        style={{
          borderColor: isPhoneMode ? `rgba(var(--bg-primary-rgb), 0.35)` : undefined,
          boxShadow: isPhoneMode
            ? `0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 30px rgba(var(--bg-primary-rgb), 0.2)`
            : `0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(var(--bg-primary-rgb), 0.15)`,
        }}
      >
        {/* Top ambient color bar based on detected music */}
        <div
          className="h-1 w-full transition-colors duration-700"
          style={{
            backgroundColor: 'var(--bg-primary)',
            boxShadow: '0 0 10px var(--theme-glow)',
          }}
        />

        {/* Simulated Smartphone Speaker & Camera Notch only in Desktop Phone Mode */}
        {isPhoneMode && (
          <div className="hidden sm:flex items-center justify-between px-6 pt-2.5 pb-1 bg-slate-900/90 text-[11px] text-slate-400 font-mono border-b border-slate-800/60 z-40">
            <span className="font-bold text-slate-300">09:41</span>
            <div className="w-20 h-4 bg-black rounded-full mx-auto" />
            <span className="flex items-center gap-1">
              <span>5G</span>
              <span style={{ color: 'var(--text-accent)' }}>100%</span>
            </span>
          </div>
        )}

        {/* Content App Frame - Fully responsive and touch-optimized */}
        <div className="flex-1 flex flex-col relative overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
