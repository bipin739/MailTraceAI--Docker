import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme =
  | 'obsidian'
  | 'blossom'
  | 'violet'
  | 'paper'
  | 'terra'
  | 'arcade'
  | 'nocturne'
  | 'nebula'
  | 'carnival';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  description: string;
  accentLabel: string;
  previewBg: string;
  previewSurface: string;
  previewAccent: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Deep stone dark theme with subtle olive green accents',
    accentLabel: 'Olive Green',
    previewBg: '#0d0f0e',
    previewSurface: '#151916',
    previewAccent: '#7e945c',
    isDark: true,
  },
  {
    id: 'blossom',
    name: 'Blossom',
    description: 'Crisp porcelain light surfaces with restrained pastel pink highlights',
    accentLabel: 'Pastel Rose',
    previewBg: '#faf9f9',
    previewSurface: '#ffffff',
    previewAccent: '#c76587',
    isDark: false,
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Deep neutral charcoal-purple with technical violet accents',
    accentLabel: 'Refined Violet',
    previewBg: '#0f0e17',
    previewSurface: '#191626',
    previewAccent: '#8374e6',
    isDark: true,
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'Warm cream dossier background with dark ink typography',
    accentLabel: 'Technical Ink',
    previewBg: '#f6f3eb',
    previewSurface: '#fdfbf7',
    previewAccent: '#7a5f45',
    isDark: false,
  },
  {
    id: 'terra',
    name: 'Terra',
    description: 'Bento grid layout inspired with warm terracotta clay & earthy tones',
    accentLabel: 'Terracotta Clay',
    previewBg: '#f5f0e6',
    previewSurface: '#fdfbf5',
    previewAccent: '#a8672f',
    isDark: false,
  },
  {
    id: 'arcade',
    name: 'Arcade',
    description: 'Retrofuturistic synthwave dark theme with electric neon magenta',
    accentLabel: 'Neon Magenta',
    previewBg: '#0a0714',
    previewSurface: '#140f24',
    previewAccent: '#ff2ea6',
    isDark: true,
  },
  {
    id: 'nocturne',
    name: 'Nocturne',
    description: 'Dark Mode 2.0 minimal pitch-black aesthetic with eco green accents',
    accentLabel: 'Eco Green',
    previewBg: '#000000',
    previewSurface: '#0d0d0d',
    previewAccent: '#3ddc84',
    isDark: true,
  },
  {
    id: 'nebula',
    name: 'Nebula',
    description: 'Deep cosmic deep-space dark theme with electric indigo accents',
    accentLabel: 'Electric Indigo',
    previewBg: '#080c1a',
    previewSurface: '#10162b',
    previewAccent: '#4c6fff',
    isDark: true,
  },
  {
    id: 'carnival',
    name: 'Carnival',
    description: 'Maximalist mixed-media warm light theme with hot coral highlights',
    accentLabel: 'Hot Coral',
    previewBg: '#fff5e8',
    previewSurface: '#ffffff',
    previewAccent: '#ff5c8a',
    isDark: false,
  },
];

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isDark: boolean;
  themeMeta: ThemeOption;
}

const STORAGE_KEY = 'mailtrace_theme';
const DEFAULT_THEME: AppTheme = 'obsidian';
const VALID_THEMES: AppTheme[] = [
  'obsidian',
  'blossom',
  'violet',
  'paper',
  'terra',
  'arcade',
  'nocturne',
  'nebula',
  'carnival',
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_THEMES.includes(stored as AppTheme)) {
        return stored as AppTheme;
      }
    } catch {
      // Fallback on restricted storage environments
    }
    return DEFAULT_THEME;
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    const activeMeta = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];
    if (activeMeta.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const currentMeta = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark: currentMeta.isDark,
        themeMeta: currentMeta,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
