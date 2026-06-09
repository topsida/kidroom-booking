import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  background: string;
  white: string;
  text: string;
  textLight: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  star: string;
}

export type ThemeId = 'warm' | 'dark' | 'nature' | 'kids';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  emoji: string;
  colors: ThemeColors;
}

const SHARED = { success: '#4CAF50', warning: '#FF9800', error: '#F44336', star: '#FFD700' };

export const THEMES: ThemeDef[] = [
  {
    id: 'warm',
    name: 'Тёплый',
    emoji: '🌅',
    colors: {
      primary: '#FF6B35',
      primaryLight: '#FFE0CC',
      secondary: '#E05A28',
      background: '#FFF9F5',
      white: '#FFFFFF',
      text: '#2D2D3A',
      textLight: '#8E8EA9',
      border: '#EED8CC',
      ...SHARED,
    },
  },
  {
    id: 'dark',
    name: 'Тёмный',
    emoji: '🌙',
    colors: {
      primary: '#6C63FF',
      primaryLight: '#2A2640',
      secondary: '#FF6B9D',
      background: '#0A0A1A',
      white: '#1A1A2E',
      text: '#F0F0FF',
      textLight: '#8888AA',
      border: '#2A2A4A',
      ...SHARED,
    },
  },
  {
    id: 'nature',
    name: 'Природный',
    emoji: '🌿',
    colors: {
      primary: '#2ECC71',
      primaryLight: '#D4F5E5',
      secondary: '#27AE60',
      background: '#F0F7F4',
      white: '#FFFFFF',
      text: '#1A3A2A',
      textLight: '#6A8A7A',
      border: '#C8E6D8',
      ...SHARED,
    },
  },
  {
    id: 'kids',
    name: 'Детский',
    emoji: '🎀',
    colors: {
      primary: '#FF4B8B',
      primaryLight: '#FFD6E8',
      secondary: '#FF80B0',
      background: '#FFF5F8',
      white: '#FFFFFF',
      text: '#2D1A24',
      textLight: '#9A7A88',
      border: '#F0D0DD',
      ...SHARED,
    },
  },
];

interface ThemeContextType {
  theme: ThemeDef;
  colors: ThemeColors;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES[0],
  colors: THEMES[0].colors,
  setTheme: () => {},
});

const STORAGE_KEY = 'app_theme_id';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeDef>(THEMES[0]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(id => {
      const found = THEMES.find(t => t.id === id);
      if (found) setThemeState(found);
    });
  }, []);

  function setTheme(id: ThemeId) {
    const found = THEMES.find(t => t.id === id)!;
    setThemeState(found);
    AsyncStorage.setItem(STORAGE_KEY, id);
  }

  return (
    <ThemeContext.Provider value={{ theme, colors: theme.colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
