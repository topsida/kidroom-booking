import { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Room, Genre, Difficulty } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';

// ── визуальные словари ────────────────────────────────────────────────────────

const GENRE_META: Record<Genre, { emoji: string; bg: string }> = {
  'хоррор':     { emoji: '👻', bg: '#7B1010' },
  'детектив':   { emoji: '🔍', bg: '#1A3A5C' },
  'приключение':{ emoji: '⚔️', bg: '#1A5C2A' },
  'детский':    { emoji: '🎈', bg: '#C04A00' },
  'VR':         { emoji: '🥽', bg: '#4A0E8F' },
  'перформанс': { emoji: '🎭', bg: '#8F0E6A' },
};

const DIFF_COLOR: Record<string, string> = {
  'новичок': '#1A8A3A',
  'средний': '#B06000',
  'опытный': '#B01010',
};

const SCARY_LABEL: Record<string, string> = {
  'немного': '😨 Немного страшно',
  'хоррор':  '💀 Хоррор',
};

// ── компонент ─────────────────────────────────────────────────────────────────

export function RoomCard({ room }: { room: Room }) {
  const router = useRouter();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(room.id);

  const price  = room.price_per_team ?? room.price_per_hour;
  const genre  = room.genre ? GENRE_META[room.genre] : null;
  const scary  = room.is_scary && room.is_scary !== 'нет' ? SCARY_LABEL[room.is_scary] : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
      activeOpacity={0.92}
    >
      {/* Фото с жанр-бейджем */}
      <View>
        <Image
          source={{ uri: room.photos[0] ?? 'https://placehold.co/400x200/1A3A5C/FFFFFF?text=КвестРум' }}
          style={styles.photo}
          resizeMode="cover"
        />
        {genre && (
          <View style={[styles.genreBadge, { backgroundColor: genre.bg }]}>
            <Text style={styles.genreText}>{genre.emoji} {room.genre}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.favBtn}
          onPress={() => toggleFavorite(room.id)}
          hitSlop={8}
          activeOpacity={0.8}
        >
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? '#FF6B9D' : '#fff'} />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        {/* Название + рейтинг */}
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{room.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={C.star} />
            <Text style={styles.ratingText}>{room.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Адрес */}
        <View style={styles.addrRow}>
          <Ionicons name="location-outline" size={13} color={C.textLight} />
          <Text style={styles.address} numberOfLines={1}>{room.address}</Text>
        </View>

        {/* Характеристики: длительность · игроки · сложность */}
        <View style={styles.specsRow}>
          {room.duration_minutes != null && (
            <View style={styles.spec}>
              <Ionicons name="time-outline" size={13} color={C.textLight} />
              <Text style={styles.specText}>{room.duration_minutes} мин</Text>
            </View>
          )}
          {room.min_players != null && room.max_players != null && (
            <View style={styles.spec}>
              <Ionicons name="people-outline" size={13} color={C.textLight} />
              <Text style={styles.specText}>{room.min_players}–{room.max_players} чел</Text>
            </View>
          )}
          {room.difficulty && (
            <View style={[styles.diffBadge, { backgroundColor: DIFF_COLOR[room.difficulty] + '18' }]}>
              <Text style={[styles.diffText, { color: DIFF_COLOR[room.difficulty] }]}>
                {room.difficulty}
              </Text>
            </View>
          )}
        </View>

        {/* Теги: возраст · актёр · страшность */}
        {(room.age_limit || room.has_actor || scary) ? (
          <View style={styles.tagsRow}>
            {room.age_limit && (
              <View style={styles.tag}><Text style={styles.tagText}>{room.age_limit}</Text></View>
            )}
            {room.has_actor && (
              <View style={[styles.tag, { backgroundColor: C.primaryLight, borderColor: C.primary }]}>
                <Text style={[styles.tagText, { color: C.primary }]}>🎭 Актёр</Text>
              </View>
            )}
            {scary && (
              <View style={[styles.tag, { backgroundColor: '#FFE4E4', borderColor: '#FF6666' }]}>
                <Text style={[styles.tagText, { color: '#B01010' }]}>{scary}</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Цена + кнопка */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{price.toLocaleString('ru-RU')} ₽</Text>
            <Text style={styles.perLabel}>за команду</Text>
          </View>
          <View style={styles.pill}><Text style={styles.pillText}>Забронировать</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.white, borderRadius: 16, marginBottom: 16,
      overflow: 'hidden', elevation: 3,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10,
    },
    photo: { width: '100%', height: 185 },
    genreBadge: {
      position: 'absolute', top: 10, left: 10,
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    genreText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    favBtn: {
      position: 'absolute', top: 10, right: 10,
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', alignItems: 'center',
    },
    info: { padding: 14, gap: 8 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 17, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
    ratingBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: '#FFF9E6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    },
    ratingText: { fontSize: 12, fontWeight: '700', color: '#9A7000' },
    addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    address: { fontSize: 13, color: C.textLight, flex: 1 },
    specsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    spec: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    specText: { fontSize: 13, color: C.textLight },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    diffText: { fontSize: 12, fontWeight: '600' },
    tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    tag: {
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
      borderWidth: 1, borderColor: C.border, backgroundColor: C.background,
    },
    tagText: { fontSize: 12, fontWeight: '600', color: C.text },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
    price: { fontSize: 20, fontWeight: '800', color: C.primary },
    perLabel: { fontSize: 12, color: C.textLight, marginTop: 1 },
    pill: { backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
    pillText: { fontSize: 13, fontWeight: '600', color: C.primary },
  });
}
