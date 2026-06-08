import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Room, Review } from '@/types';
import { Colors } from '@/constants/colors';
import { StarRating } from '@/components/StarRating';

const W = Dimensions.get('window').width;

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      supabase.from('rooms').select('*').eq('id', id).single(),
      supabase.from('reviews').select('*, users(name)').eq('room_id', id).order('created_at', { ascending: false }),
    ]).then(([roomRes, reviewsRes]) => {
      setRoom(roomRes.data);
      setReviews(reviewsRes.data ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading || !room) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View>
        <ScrollView
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
        >
          {room.photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={[styles.photo, { width: W }]} resizeMode="cover" />
          ))}
        </ScrollView>
        {room.photos.length > 1 && (
          <View style={styles.dots}>
            {room.photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{room.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color={Colors.star} />
            <Text style={styles.ratingText}>{room.rating.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location" size={15} color={Colors.primary} />
          <Text style={styles.infoText}>{room.address}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time" size={15} color={Colors.primary} />
          <Text style={styles.infoText}>
            Работает {room.working_hours_start.slice(0, 5)} — {room.working_hours_end.slice(0, 5)}
          </Text>
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Стоимость за час</Text>
          <Text style={styles.price}>{room.price_per_hour} ₽</Text>
        </View>

        <Text style={styles.description}>{room.description}</Text>

        <Text style={styles.sectionTitle}>Отзывы{reviews.length > 0 ? ` (${reviews.length})` : ''}</Text>

        {reviews.length === 0 ? (
          <View style={styles.noReviewsBox}>
            <Text style={styles.noReviews}>Пока нет отзывов. Будьте первым!</Text>
          </View>
        ) : reviews.map(r => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{r.users?.name || 'Гость'}</Text>
              <StarRating value={r.rating} size={14} />
            </View>
            {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
            <Text style={styles.reviewDate}>
              {new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push({ pathname: '/booking/[roomId]', params: { roomId: room.id, roomName: room.name } })}
        >
          <Text style={styles.bookBtnText}>Забронировать — {room.price_per_hour} ₽/час</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photo: { height: 270 },
  dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: Colors.white, width: 22 },
  content: { padding: 20, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text, flex: 1, marginRight: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF9E6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#9A7000' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: Colors.textLight, flex: 1 },
  priceBox: { backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  price: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  description: { fontSize: 15, color: Colors.text, lineHeight: 23 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 4 },
  noReviewsBox: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  noReviews: { color: Colors.textLight, fontSize: 14, fontStyle: 'italic' },
  reviewCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, gap: 6, borderWidth: 1, borderColor: Colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontWeight: '700', color: Colors.text, fontSize: 14 },
  reviewComment: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  reviewDate: { fontSize: 12, color: Colors.textLight },
  footer: { padding: 20, paddingTop: 0 },
  bookBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 18, alignItems: 'center' },
  bookBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
