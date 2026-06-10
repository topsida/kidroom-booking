import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'kidroom_favorites';

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (roomId: string) => boolean;
  toggleFavorite: (roomId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setFavorites(JSON.parse(raw));
    });
  }, []);

  const toggleFavorite = useCallback((roomId: string) => {
    setFavorites(prev => {
      const next = prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (roomId: string) => favorites.includes(roomId),
    [favorites],
  );

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
