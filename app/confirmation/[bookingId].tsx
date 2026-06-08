import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { sendTelegramMessage, bookingConfirmationText } from '@/lib/telegram';
import { Booking } from '@/types';
import { Colors } from '@/constants/colors';

export default function ConfirmationScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramSent, setTelegramSent] = useState(false);
  const router = useRouter();

  useEffect(() => { load(); }, [bookingId]);

  async function load() {
    const { data } = await supabase
      .from('bookings').select('*, rooms(*)').eq('id', bookingId).single();
    setBooking(data);
    setLoading(false);

    if (data?.rooms) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users').select('telegram_chat_id').eq('id', user.id).single();
        if (profile?.telegram_chat_id) {
          await sendTelegramMessage(
            profile.telegram_chat_id,
            bookingConfirmationText({
              roomName: data.rooms.name,
              date: new Date(data.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
              time: data.time_slot.slice(0, 5),
              childName: data.child_name,
              childAge: data.child_age,
              price: data.rooms.price_per_hour,
            })
          );
          setTelegramSent(true);
        }
      }
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }
  if (!booking) return null;

  const dateFormatted = new Date(booking.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Ionicons name="checkmark-circle" size={88} color={Colors.success} style={styles.icon} />
          <Text style={styles.title}>Бронирование{'\n'}подтверждено!</Text>
          <Text style={styles.subtitle}>Ждём вас! 🌟</Text>

          <View style={styles.card}>
            <Row icon="home-outline" label="Комната" value={booking.rooms?.name ?? ''} />
            <Row icon="location-outline" label="Адрес" value={booking.rooms?.address ?? ''} />
            <Row icon="calendar-outline" label="Дата" value={dateFormatted} />
            <Row icon="time-outline" label="Время" value={booking.time_slot.slice(0, 5)} />
            <Row icon="happy-outline" label="Ребёнок" value={`${booking.child_name}, ${booking.child_age} лет`} />
            <Row icon="cash-outline" label="Стоимость" value={`${booking.rooms?.price_per_hour} ₽`} last />
          </View>

          {telegramSent && (
            <View style={styles.telegramBanner}>
              <Ionicons name="paper-plane" size={18} color={Colors.secondary} />
              <Text style={styles.telegramText}>Уведомление отправлено в Telegram</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/bookings')}>
            <Text style={styles.primaryBtnText}>Мои бронирования</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.secondaryBtnText}>На главную</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[row.wrap, last && row.last]}>
      <Ionicons name={icon as any} size={18} color={Colors.primary} />
      <Text style={row.label}>{label}</Text>
      <Text style={row.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}
const row = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.border },
  last: { borderBottomWidth: 0 },
  label: { fontSize: 13, color: Colors.textLight, width: 76 },
  value: { fontSize: 14, color: Colors.text, fontWeight: '600', flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, alignItems: 'center', gap: 16 },
  icon: { marginTop: 16 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, textAlign: 'center', lineHeight: 34 },
  subtitle: { fontSize: 15, color: Colors.textLight },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, width: '100%', borderWidth: 1, borderColor: Colors.border },
  telegramBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EEF0FF', borderRadius: 12, padding: 14, width: '100%' },
  telegramText: { fontSize: 14, color: Colors.secondary, fontWeight: '500', flex: 1 },
  footer: { padding: 20, gap: 12 },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 17, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: Colors.white, borderRadius: 14, padding: 17, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  secondaryBtnText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
});
