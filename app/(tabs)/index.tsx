import { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, Modal,
  TextInput, ActivityIndicator, RefreshControl,
  TouchableOpacity, TouchableWithoutFeedback,
  Animated, PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Room, RoomFilters, PricingRule } from '@/types';
import { getMinPrice } from '@/lib/pricing';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { RoomCard } from '@/components/RoomCard';
import { RoomsMap } from '@/components/RoomsMap';
import { FilterChips } from '@/components/FilterChips';
import { useAuth } from '@/hooks/useAuth';

type ViewMode = 'list' | 'map';

const DEFAULT_FILTERS: RoomFilters = { price: null, age: null, rating: null };
const PANEL_HEIGHT = 600;

function activeCount(f: RoomFilters) {
  return [f.price, f.age, f.rating].filter(Boolean).length;
}

export default function HomeScreen() {
  const { isGuest } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [filtered, setFiltered] = useState<Room[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<RoomFilters>(DEFAULT_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Анимация панели
  const panY = useRef(new Animated.Value(PANEL_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 4 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) panY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          closePanel();
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    })
  ).current;

  function openPanel() {
    setPanelOpen(true);
    panY.setValue(PANEL_HEIGHT);
    Animated.parallel([
      Animated.spring(panY, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 14 }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }

  function closePanel() {
    Animated.parallel([
      Animated.timing(panY, { toValue: PANEL_HEIGHT, duration: 240, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setPanelOpen(false);
      panY.setValue(PANEL_HEIGHT);
    });
  }

  useEffect(() => { loadRooms(); }, []);

  useEffect(() => {
    let result = rooms;

    const q = search.toLowerCase().trim();
    if (q) result = result.filter(r =>
      r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)
    );

    if (filters.price === 'lt500')     result = result.filter(r => r.price_per_hour < 500);
    if (filters.price === '500to1000') result = result.filter(r => r.price_per_hour >= 500 && r.price_per_hour <= 1000);
    if (filters.price === 'gt1000')    result = result.filter(r => r.price_per_hour > 1000);

    if (filters.age === 'lt3')
      result = result.filter(r => r.min_age == null || r.min_age <= 3);
    if (filters.age === '3to7')
      result = result.filter(r => (r.min_age == null || r.min_age <= 7) && (r.max_age == null || r.max_age >= 3));
    if (filters.age === 'gt7')
      result = result.filter(r => r.max_age == null || r.max_age >= 7);

    if (filters.rating === '4.5') result = result.filter(r => r.rating >= 4.5);
    if (filters.rating === '4.0') result = result.filter(r => r.rating >= 4.0);

    setFiltered(result);
  }, [search, filters, rooms]);

  async function loadRooms() {
    const [roomsRes, rulesRes] = await Promise.all([
      supabase.from('rooms').select('*').order('rating', { ascending: false }),
      supabase.from('pricing_rules').select('*').eq('is_active', true),
    ]);
    setRooms(roomsRes.data ?? []);
    setPricingRules(rulesRes.data ?? []);
    setLoading(false);
    setRefreshing(false);
  }

  const count = activeCount(filters);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Шапка */}
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
            <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? '#fff' : C.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map-outline" size={18} color={viewMode === 'map' ? '#fff' : C.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Гостевой баннер */}
      {isGuest && (
        <View style={styles.guestBanner}>
          <Ionicons name="information-circle" size={16} color={C.warning} />
          <Text style={styles.guestBannerText}>Гостевой режим — данные не сохранятся после выхода</Text>
        </View>
      )}

      {/* Поиск + кнопка фильтров */}
      {viewMode === 'list' && (
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={C.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={C.textLight}
              clearButtonMode="while-editing"
            />
          </View>

          <TouchableOpacity
            style={[styles.filterBtn, count > 0 && { borderColor: C.primary }]}
            onPress={openPanel}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={17} color={count > 0 ? C.primary : C.textLight} />
            <Text style={[styles.filterBtnText, count > 0 && { color: C.primary }]}>
              Фильтры
            </Text>
            {count > 0 && (
              <View style={[styles.badge, { backgroundColor: C.primary }]}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Список или карта */}
      {viewMode === 'list' ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
              <RoomCard
                room={item}
                minPrice={getMinPrice(
                  item.price_per_hour,
                  pricingRules.filter(r => r.room_id === item.id),
                )}
              />
            )}
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
              {count > 0 && (
                <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)}>
                  <Text style={[styles.resetLink, { color: C.primary }]}>Сбросить фильтры</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      ) : (
        <RoomsMap rooms={rooms} />
      )}

      {/* Панель фильтров */}
      <Modal
        visible={panelOpen}
        transparent
        animationType="none"
        onRequestClose={closePanel}
      >
        <View style={styles.modalContainer}>
          {/* Затемнение — анимированное */}
          <TouchableWithoutFeedback onPress={closePanel}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </TouchableWithoutFeedback>

          {/* Сама панель — тянется вниз */}
          <Animated.View
            style={[
              styles.panel,
              { paddingBottom: insets.bottom + 16 },
              { transform: [{ translateY: panY }] },
            ]}
          >
            {/* Зона свайпа: ручка + заголовок */}
            <View {...panResponder.panHandlers}>
              <View style={styles.handle} />
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Фильтры</Text>
                {count > 0 && (
                  <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)}>
                    <Text style={[styles.panelReset, { color: C.error }]}>Сбросить</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Чипы */}
            <FilterChips filters={filters} onChange={setFilters} colors={C} />

            {/* Кнопка применить */}
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: C.primary }]}
              onPress={closePanel}
              activeOpacity={0.85}
            >
              <Text style={styles.applyBtnText}>
                {filtered.length === 0
                  ? 'Ничего не найдено'
                  : `Показать ${filtered.length} ${rooms_word(filtered.length)}`}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function rooms_word(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'комнату';
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'комнаты';
  return 'комнат';
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 10,
    },
    title:    { fontSize: 26, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 14, color: C.textLight, marginTop: 2 },

    toggle: {
      flexDirection: 'row',
      backgroundColor: C.white,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: C.border,
      overflow: 'hidden',
    },
    toggleBtn:       { padding: 9 },
    toggleBtnActive: { backgroundColor: C.primary },

    guestBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: C.primaryLight,
      marginHorizontal: 20, marginBottom: 6,
      borderRadius: 10, padding: 10,
      borderWidth: 1, borderColor: C.border,
    },
    guestBannerText: { fontSize: 13, color: C.text, flex: 1, opacity: 0.8 },

    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.white,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: C.border,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15, color: C.text },

    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: C.white,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderWidth: 1.5,
      borderColor: C.border,
    },
    filterBtnText: { fontSize: 14, fontWeight: '600', color: C.textLight },
    badge: {
      minWidth: 18, height: 18,
      borderRadius: 9,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

    list:      { paddingHorizontal: 20, paddingBottom: 20 },
    empty:     { alignItems: 'center', paddingTop: 80, gap: 10 },
    emptyEmoji:{ fontSize: 48 },
    emptyText: { color: C.textLight, fontSize: 16 },
    resetLink: { fontSize: 14, fontWeight: '600' },

    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    panel: {
      backgroundColor: C.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      gap: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 16,
    },
    handle: {
      width: 40, height: 4,
      borderRadius: 2,
      backgroundColor: C.border,
      alignSelf: 'center',
      marginBottom: 8,
    },
    panelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 4,
    },
    panelTitle: { fontSize: 20, fontWeight: '800', color: C.text },
    panelReset: { fontSize: 14, fontWeight: '600' },
    applyBtn: {
      marginHorizontal: 20,
      borderRadius: 16,
      padding: 17,
      alignItems: 'center',
    },
    applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
