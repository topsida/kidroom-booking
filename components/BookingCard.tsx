import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '@/types';
import { Colors } from '@/constants/colors';

const STATUS: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Подтверждено', color: Colors.success },
  pending:   { label: 'Ожидает',      color: Colors.warning },
  cancelled: { label: 'Отменено',     color: Colors.error },
  completed: { label: 'Завершено',    color: Colors.textLight },
};

export function BookingCard({ booking, onCancel }: { booking: Booking; onCancel?: () => void }) {
  const status = STATUS[booking.status] ?? STATUS.confirmed;
  const dateFormatted = new Date(booking.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  function confirmCancel() {
    Alert.alert('Отменить бронирование?', `${booking.rooms?.name} · ${dateFormatted}`, [
      { text: 'Нет', style: 'cancel' },
      { text: 'Да, отменить', style: 'destructive', onPress: onCancel },
    ]);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{booking.rooms?.name ?? 'Комната'}</Text>
        <View style={[styles.badge, { backgroundColor: status.color + '22' }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={14} color={Colors.textLight} />
        <Text style={styles.detail}>{dateFormatted}</Text>
        <Ionicons name="time-outline" size={14} color={Colors.textLight} />
        <Text style={styles.detail}>{booking.time_slot.slice(0, 5)}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="happy-outline" size={14} color={Colors.textLight} />
        <Text style={styles.detail}>{booking.child_name}, {booking.child_age} лет</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.price}>{booking.rooms?.price_per_hour} ₽</Text>
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={confirmCancel}>
            <Text style={styles.cancelText}>Отменить</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detail: { fontSize: 14, color: Colors.textLight, marginRight: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.error },
  cancelText: { fontSize: 13, fontWeight: '600', color: Colors.error },
});
