import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '@/types';
import { Colors } from '@/constants/colors';

export function RoomCard({ room }: { room: Room }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
      activeOpacity={0.92}
    >
      <Image
        source={{ uri: room.photos[0] ?? 'https://placehold.co/400x200/FFE0ED/FF6B9D?text=KidRoom' }}
        style={styles.photo}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{room.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={Colors.star} />
            <Text style={styles.ratingText}>{room.rating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.addrRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textLight} />
          <Text style={styles.address} numberOfLines={1}>{room.address}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>{room.price_per_hour} ₽<Text style={styles.perHour}>/час</Text></Text>
          <View style={styles.pill}><Text style={styles.pillText}>Забронировать</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10 },
  photo: { width: '100%', height: 185 },
  info: { padding: 14, gap: 7 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF9E6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#9A7000' },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { fontSize: 13, color: Colors.textLight, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  price: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  perHour: { fontSize: 13, fontWeight: '400', color: Colors.textLight },
  pill: { backgroundColor: Colors.primaryLight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
