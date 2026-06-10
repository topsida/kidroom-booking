import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Room } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { RoomCard } from '@/components/RoomCard';
import { RoomsMap } from '@/components/RoomsMap';
import { useAuth } from '@/hooks/useAuth';

type ViewMode = 'list' | 'map';

export default function HomeScreen() {
  const { isGuest } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [filtered, setFiltered] = useState<Room[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => { loadRooms(); }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(q
      ? rooms.filter(r => r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q))
      : rooms
    );
  }, [search, rooms]);

  async function loadRooms() {
    const { data } = await supabase.from('rooms').select('*').order('rating', { ascending: false });
    setRooms(data ?? []);
    setFiltered(data ?? []);
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
        <View>
          <Text style={styles.title}>🎪 КидРум</Text>
          <Text style={styles.subtitle}>Найди идеальную игровую комнату</Text>
        </View>

        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={viewMode === 'list' ? '#fff' : C.textLight}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons
              name="map-outline"
              size={18}
              color={viewMode === 'map' ? '#fff' : C.textLight}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isGuest && (
        <View style={styles.guestBanner}>
          <Ionicons name="information-circle" size={16} color={C.warning} />
          <Text style={styles.guestBannerText}>Гостевой режим — данные не сохранятся после выхода</Text>
        </View>
      )}

      {viewMode === 'list' && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={C.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по названию или адресу..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={C.textLight}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {viewMode === 'list' ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <RoomCard room={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadRooms(); }}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Ничего не найдено</Text>
            </View>
          }
        />
      ) : (
        <RoomsMap rooms={rooms} />
      )}
    </SafeAreaView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 10,
    },
    title: { fontSize: 26, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 14, color: C.textLight, marginTop: 2 },

    toggle: {
      flexDirection: 'row',
      backgroundColor: C.white,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: C.border,
      overflow: 'hidden',
    },
    toggleBtn: { padding: 9 },
    toggleBtnActive: { backgroundColor: C.primary },

    guestBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: C.primaryLight,
      marginHorizontal: 20,
      marginBottom: 6,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    guestBannerText: { fontSize: 13, color: C.text, flex: 1, opacity: 0.8 },

    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.white,
      marginHorizontal: 20,
      marginBottom: 8,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: C.border,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15, color: C.text },

    list: { paddingHorizontal: 20, paddingBottom: 20 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
    emptyEmoji: { fontSize: 48 },
    emptyText: { color: C.textLight, fontSize: 16 },
  });
}
