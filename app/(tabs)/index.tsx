import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Room } from '@/types';
import { Colors } from '@/constants/colors';
import { RoomCard } from '@/components/RoomCard';
import { useAuth } from '@/hooks/useAuth';

export default function HomeScreen() {
  const { isGuest } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filtered, setFiltered] = useState<Room[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎪 КидРум</Text>
        <Text style={styles.subtitle}>Найди идеальную игровую комнату</Text>
      </View>

      {isGuest && (
        <View style={styles.guestBanner}>
          <Ionicons name="information-circle" size={16} color={Colors.warning} />
          <Text style={styles.guestBannerText}>Гостевой режим — данные не сохранятся после выхода</Text>
        </View>
      )}

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по названию или адресу..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.textLight}
          clearButtonMode="while-editing"
        />
      </View>

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
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>Ничего не найдено</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8E1',
    marginHorizontal: 20,
    marginBottom: 4,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  guestBannerText: { fontSize: 13, color: '#7A5C00', flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: Colors.textLight, fontSize: 16 },
});
