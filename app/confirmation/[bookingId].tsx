import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { sendTelegramMessage, bookingConfirmationText } from '@/lib/telegram';
import { Booking } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

export default function ConfirmationScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const rowStyles = useMemo(() => makeRowStyles(C), [C]);

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
    return <View style={styles.centered}><ActivityIndicator size="large" color={C.primary} /></View>;
  }
  if (!booking) return null;

  const dateFormatted = new Date(booking.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Ionicons name="checkmark-circle" size={88} color={C.success} style={styles.icon} />
          <Text style={styles.title}>Бронирование{'\n'}подтверждено!</Text>
          <Text style={styles.subtitle}>Ждём вас! 🌟</Text>

          <View style={styles.card}>
            <Row icon="home-outline" label="Комната" value={booking.rooms?.name ?? ''} rowStyles={rowStyles} />
            <Row icon="location-outline" label="Адрес" value={booking.rooms?.address ?? ''} rowStyles={rowStyles} />
            <Row icon="calendar-outline" label="Дата" value={dateFormatted} rowStyles={rowStyles} />
            <Row icon="time-outline" label="Время" value={booking.time_slot.slice(0, 5)} rowStyles={rowStyles} />
            <Row icon="happy-outline" label="Ребёнок" value={`${booking.child_name}, ${booking.child_age} лет`} rowStyles={rowStyles} />
            <Row icon="cash-outline" label="Стоимость" value={`${booking.rooms?.price_per_hour} ₽`} last rowStyles={rowStyles} />
          </View>

          {telegramSent && (
            <View style={styles.telegramBanner}>
              <Ionicons name="paper-plane" size={18} color={C.secondary} />
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

function Row({ icon, label, value, last, rowStyles }: { icon: string; label: string; value: string; last?: boolean; rowStyles: ReturnType<typeof makeRowStyles> }) {
  return (
    <View style={[rowStyles.wrap, last && rowStyles.last]}>
      <Ionicons name={icon as any} size={18} color={rowStyles._primary as any} />
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function makeRowStyles(C: ThemeColors) {
  return {
    _primary: C.primary,
    ...StyleSheet.create({
      wrap: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
      last: { borderBottomWidth: 0 },
      label: { fontSize: 13, color: C.textLight, width: 76 },
      value: { fontSize: 14, color: C.text, fontWeight: '600' as const, flex: 1 },
    }),
  };
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },
    content: { padding: 24, alignItems: 'center', gap: 16 },
    icon: { marginTop: 16 },
    title: { fontSize: 26, fontWeight: '800', color: C.text, textAlign: 'center', lineHeight: 34 },
    subtitle: { fontSize: 15, color: C.textLight },
    card: { backgroundColor: C.white, borderRadius: 16, padding: 16, width: '100%', borderWidth: 1, borderColor: C.border },
    telegramBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.primaryLight, borderRadius: 12, padding: 14, width: '100%' },
    telegramText: { fontSize: 14, color: C.secondary, fontWeight: '500', flex: 1 },
    footer: { padding: 20, gap: 12 },
    primaryBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 17, alignItems: 'center' },
    primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    secondaryBtn: { backgroundColor: C.white, borderRadius: 14, padding: 17, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
    secondaryBtnText: { color: C.text, fontSize: 16, fontWeight: '600' },
  });
}
