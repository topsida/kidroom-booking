import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  background: string;
  header: string;
  white: string;
  text: string;
  textLight: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  star: string;
}

export type ThemeId = 'dark' | 'light';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  emoji: string;
  colors: ThemeColors;
}

const SHARED = { success: '#4CAF50', warning: '#FF9800', error: '#F44336', star: '#FFD700' };

export const THEMES: ThemeDef[] = [
  {
    id: 'dark',
    name: 'Тёмная',
    emoji: '🌙',
    colors: {
      primary:      '#1D9E75',
      primaryLight: '#0d3d2e',
      secondary:    '#16836E',
      background:   '#111111',
      header:       '#0a0a0a',
      white:        '#1a1a1a',
      text:         '#F0F0F0',
      textLight:    '#666666',
      border:       '#2a2a2a',
      ...SHARED,
    },
  },
  {
    id: 'light',
    name: 'Светлая',
    emoji: '☀️',
    colors: {
      primary:      '#1D9E75',
      primaryLight: '#E0F5EE',
      secondary:    '#16836E',
      background:   '#F5F5F5',
      header:       '#FFFFFF',
      white:        '#FFFFFF',
      text:         '#1A1A1A',
      textLight:    '#888888',
      border:       '#E0E0E0',
      ...SHARED,
    },
  },
];

interface ThemeContextType {
  theme: ThemeDef;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (id: ThemeId) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES[0],
  colors: THEMES[0].colors,
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
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

  function toggleTheme() {
    setTheme(theme.id === 'dark' ? 'light' : 'dark');
  }

  const isDark = theme.id === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, colors: theme.colors, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
