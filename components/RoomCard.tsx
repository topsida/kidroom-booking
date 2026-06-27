import { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Room, Genre } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';

const HAT = require('../assets/adaptive-icon.png');

const GENRE_META: Record<Genre, { emoji: string; hatIcon?: true; bg: string }> = {
  'хоррор':     { emoji: '👻', bg: '#7B1010' },
  'детектив':   { emoji: '🔍', bg: '#1A3A5C' },
  'приключение':{ emoji: '⚔️', bg: '#1A5C2A' },
  'детский':    { emoji: '🎈', bg: '#C04A00' },
  'VR':         { emoji: '🥽', bg: '#4A0E8F' },
  'перформанс': { emoji: '', hatIcon: true, bg: '#8F0E6A' },
};

function questWord(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'квест';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'квеста';
  return 'квестов';
}

export function RoomCard({ room }: { room: Room }) {
  const router = useRouter();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(room.id);

  const quests = room.quests ?? [];
  const genres = [...new Set(quests.map(q => q.genre).filter(Boolean))] as Genre[];
  const questCount = quests.length;
  const minPrice = questCount > 0
    ? Math.min(...quests.map(q => q.price_per_team))
    : (room.price_per_team ?? room.price_per_hour ?? 0);

  const photoUri = room.photos?.[0]
    ?? 'https://placehold.co/400x200/1A3A5C/FFFFFF?text=QuestPoint';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
      activeOpacity={0.92}
    >
      {/* Фото */}
      <View>
        <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />

        {/* Жанровые бейджи поверх фото */}
        {genres.length > 0 && (
          <View style={styles.genreRow}>
            {genres.slice(0, 3).map(g => {
              const m = GENRE_META[g];
              return (
                <View key={g} style={[styles.genreBadge, { backgroundColor: m.bg }]}>
                  {m.hatIcon
                    ? <View style={styles.genreBadgeRow}>
                        <Image source={HAT} style={styles.genreHat} resizeMode="contain" />
                        <Text style={styles.genreText}>{g}</Text>
                      </View>
                    : <Text style={styles.genreText}>{m.emoji} {g}</Text>
                  }
                </View>
              );
            })}
            {genres.length > 3 && (
              <View style={[styles.genreBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                <Text style={styles.genreText}>+{genres.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Избранное */}
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

        {/* Нижняя строка: кол-во квестов + цена слева, кнопка справа */}
        <View style={styles.footer}>
          <View>
            {questCount > 0 && (
              <Text style={styles.questCount}>{questCount} {questWord(questCount)}</Text>
            )}
            <Text style={styles.price}>
              {questCount > 0 ? 'от ' : ''}{minPrice.toLocaleString('ru-RU')} ₽
            </Text>
          </View>

          <View style={styles.pill}>
            <Text style={styles.pillText}>Смотреть квесты</Text>
            <Ionicons name="arrow-forward" size={14} color={C.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.white,
      borderRadius: 16,
      marginBottom: 16,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
    },
    photo: { width: '100%', height: 185 },

    genreRow: {
      position: 'absolute',
      top: 10,
      left: 10,
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
      maxWidth: '75%',
    },
    genreBadge: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
    },
    genreText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    genreBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    genreHat: { width: 14, height: 14 },

    favBtn: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(0,0,0,0.32)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    info: { padding: 14, gap: 8 },

    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 17, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#FFF9E6',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    ratingText: { fontSize: 12, fontWeight: '700', color: '#9A7000' },

    addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    address: { fontSize: 13, color: C.textLight, flex: 1 },

    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
    },
    questCount: { fontSize: 12, color: C.textLight, marginBottom: 1 },
    price: { fontSize: 20, fontWeight: '800', color: C.primary },

    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: C.primaryLight,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    pillText: { fontSize: 13, fontWeight: '600', color: C.primary },
  });
}
