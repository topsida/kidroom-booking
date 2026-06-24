import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Room } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { RoomCard } from '@/components/RoomCard';
import { useFavorites } from '@/context/FavoritesContext';

export default function FavoritesScreen() {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { favorites } = useFavorites();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const firstLoad = useRef(true);

  useEffect(() => {
    const isFirst = firstLoad.current;
    firstLoad.current = false;
    loadRooms(favorites, isFirst);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites]);

  async function loadRooms(ids: string[], showSpinner: boolean, isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else if (showSpinner) setLoading(true);

    if (ids.length === 0) {
      setRooms([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data } = await supabase.from('rooms').select('*').in('id', ids);

    setRooms(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Избранное</Text>
        {rooms.length > 0 && (
          <Text style={styles.count}>{rooms.length}</Text>
        )}
      </View>

      <FlatList
        data={rooms}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <RoomCard room={item} />
        )}
        contentContainerStyle={[styles.list, rooms.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRooms(favorites, false, true)}
            tintColor={C.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={64} color={C.border} />
            <Text style={styles.emptyTitle}>Пока ничего нет</Text>
            <Text style={styles.emptyText}>
              Нажмите ♥ на карточке комнаты, чтобы добавить в избранное
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
    },
    title: { fontSize: 26, fontWeight: '800', color: C.text },
    count: {
      fontSize: 15,
      fontWeight: '700',
      color: C.primary,
      backgroundColor: C.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
    },

    list: { paddingHorizontal: 20, paddingBottom: 20 },
    listEmpty: { flex: 1, justifyContent: 'center' },

    empty: { alignItems: 'center', gap: 12, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    emptyText: { fontSize: 14, color: C.textLight, textAlign: 'center', lineHeight: 20 },
  });
}
