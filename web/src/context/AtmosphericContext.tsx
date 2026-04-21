'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';

interface AtmosphericTheme {
  timeOfDay: TimeOfDay;
  gradient: string;
  glowColor: string;
  blobColor: string;
  healthScore: number;
  setHealthScore: (score: number) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const getTimeOfDay = (): TimeOfDay => {
  const h = new Date().getHours();
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'noon';
  if (h >= 14 && h < 17) return 'afternoon';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
};

const timeThemes: Record<TimeOfDay, { gradient: string; glowColor: string; blobColor: string }> = {
  dawn:      { gradient: 'from-rose-100 via-amber-50 to-sky-50', glowColor: '#fb923c', blobColor: '#fdba74' },
  morning:   { gradient: 'from-sky-50 via-cyan-50 to-white',     glowColor: '#7dd3fc', blobColor: '#bae6fd' },
  noon:      { gradient: 'from-white via-sky-50 to-cyan-50',     glowColor: '#38bdf8', blobColor: '#93c5fd' },
  afternoon: { gradient: 'from-amber-50 via-orange-50 to-white', glowColor: '#fdba74', blobColor: '#fed7aa' },
  dusk:      { gradient: 'from-orange-100 via-rose-50 to-sky-50',glowColor: '#fda4af', blobColor: '#fecdd3' },
  night:     { gradient: 'from-slate-950 via-slate-900 to-slate-950',glowColor: '#7dd3fc', blobColor: '#102a43' },
};

const AtmosphericContext = createContext<AtmosphericTheme>({
  timeOfDay: 'morning',
  gradient: timeThemes.morning.gradient,
  glowColor: timeThemes.morning.glowColor,
  blobColor: timeThemes.morning.blobColor,
  healthScore: 85,
  setHealthScore: () => {},
  isDark: false,
  toggleTheme: () => {}
});

export function AtmosphericProvider({ children }: { children: ReactNode }) {
  // Initialize with default to match server
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('night');
  const [themeOverride, setThemeOverride] = useState<'light' | 'dark' | null>(null);
  const [healthScore, setHealthScore] = useState(85);

  // Update time AFTER hydration only
  useEffect(() => {
    const update = () => {
      if (!themeOverride) {
        setTimeOfDay(getTimeOfDay());
      }
    };
    update();
    const interval = setInterval(update, 60000); // update every minute
    return () => clearInterval(interval);
  }, [themeOverride]);

  const activeTimeOfDay = themeOverride === 'light' ? 'morning' : themeOverride === 'dark' ? 'night' : timeOfDay;
  const theme = timeThemes[activeTimeOfDay];

  const toggleTheme = () => {
    setThemeOverride(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      // Apply dark class to <html> so Tailwind dark: variants work
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next === 'dark');
        document.documentElement.style.colorScheme = next === 'dark' ? 'dark' : 'light';
      }
      return next;
    });
  };

  // Sync on mount from persisted override
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const saved = localStorage.getItem('theme-override') as 'light' | 'dark' | null;
    if (saved) {
      setThemeOverride(saved);
      document.documentElement.classList.toggle('dark', saved === 'dark');
    }
  }, []);

  useEffect(() => {
    if (themeOverride) localStorage.setItem('theme-override', themeOverride);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', themeOverride === 'dark');
    }
  }, [themeOverride]);


  // Override glow based on health score
  const glowColor = healthScore >= 90 ? '#6ee7d8' : healthScore >= 60 ? theme.glowColor : '#fdba74';

  return (
    <AtmosphericContext.Provider value={{ 
      timeOfDay: activeTimeOfDay, 
      ...theme, 
      glowColor, 
      healthScore, 
      setHealthScore,
      isDark: themeOverride === 'light' ? false : activeTimeOfDay === 'night' || activeTimeOfDay === 'dusk' || activeTimeOfDay === 'dawn',
      toggleTheme
    }}>
      {children}
    </AtmosphericContext.Provider>
  );
}

export const useAtmosphere = () => useContext(AtmosphericContext);
