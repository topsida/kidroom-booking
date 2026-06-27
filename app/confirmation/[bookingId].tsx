import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Booking } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';

type BookingStatus = Booking['status'];

const STATUS_CONFIG: Record<BookingStatus, {
  icon: string; iconColor: string; badgeColor: string;
  title: string; subtitle: string; badge: string;
}> = {
  pending: {
    icon: 'time-outline',
    iconColor: '#F59E0B',
    badgeColor: '#F59E0B',
    title: 'Заявка отправлена!',
    subtitle: 'Ожидайте подтверждения от организатора',
    badge: 'Ожидает подтверждения',
  },
  confirmed: {
    icon: 'checkmark-circle',
    iconColor: '#10B981',
    badgeColor: '#10B981',
    title: 'Бронирование\nподтверждено!',
    subtitle: 'Ждём вас! 🌟',
    badge: 'Подтверждено',
  },
  rejected: {
    icon: 'close-circle',
    iconColor: '#EF4444',
    badgeColor: '#EF4444',
    title: 'Заявка отклонена',
    subtitle: 'Попробуйте выбрать другое время',
    badge: 'Отклонено',
  },
  cancelled: {
    icon: 'close-circle-outline',
    iconColor: '#6B7280',
    badgeColor: '#6B7280',
    title: 'Бронирование отменено',
    subtitle: '',
    badge: 'Отменено',
  },
  completed: {
    icon: 'checkmark-done-circle',
    iconColor: '#6B7280',
    badgeColor: '#6B7280',
    title: 'Квест завершён',
    subtitle: 'Спасибо за посещение!',
    badge: 'Завершено',
  },
};

export default function ConfirmationScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const rowStyles = useMemo(() => makeRowStyles(C), [C]);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const iconScale = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  useEffect(() => { load(); }, [bookingId]);

  // Real-time подписка на изменение статуса
  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`booking-status-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
        (payload) => {
          const newStatus = payload.new.status as BookingStatus;
          setBooking(prev => prev ? { ...prev, status: newStatus } : prev);
          if (newStatus === 'confirmed') {
            setShowConfetti(true);
            Animated.sequence([
              Animated.spring(iconScale, { toValue: 1.3, useNativeDriver: true, speed: 20 }),
              Animated.spring(iconScale, { toValue: 1,   useNativeDriver: true, speed: 10 }),
            ]).start();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  async function load() {
    const { data } = await supabase
      .from('bookings')
      .select('*, rooms(*), quests(*)')
      .eq('id', bookingId)
      .single();
    setBooking(data);
    setLoading(false);
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={C.primary} /></View>;
  }
  if (!booking) return null;

  const status = booking.status in STATUS_CONFIG
    ? STATUS_CONFIG[booking.status]
    : STATUS_CONFIG.pending;

  const dateFormatted = new Date(booking.date).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const price = booking.quests?.price_per_team
    ?? booking.rooms?.price_per_team
    ?? booking.rooms?.price_per_hour
    ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Иконка статуса */}
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <Ionicons
              name={status.icon as any}
              size={88}
              color={status.iconColor}
              style={styles.icon}
            />
          </Animated.View>

          {/* Заголовок */}
          <Text style={styles.title}>{status.title}</Text>
          {status.subtitle ? <Text style={styles.subtitle}>{status.subtitle}</Text> : null}

          {/* Бейдж статуса */}
          <View style={[styles.statusBadge, { backgroundColor: status.badgeColor + '22', borderColor: status.badgeColor + '55' }]}>
            <View style={[styles.statusDot, { backgroundColor: status.badgeColor }]} />
            <Text style={[styles.statusText, { color: status.badgeColor }]}>{status.badge}</Text>
          </View>

          {/* Подсказка для pending */}
          {booking.status === 'pending' && (
            <View style={styles.pendingHint}>
              <Ionicons name="notifications-outline" size={16} color={C.textLight} />
              <Text style={styles.pendingHintText}>
                Организатор получил уведомление и скоро подтвердит вашу заявку
              </Text>
            </View>
          )}

          {/* Детали брони */}
          <View style={styles.card}>
            {booking.quests?.name && (
              <Row icon="game-controller-outline" label="Квест" value={booking.quests.name} rowStyles={rowStyles} />
            )}
            <Row icon="home-outline" label="Место" value={booking.rooms?.name ?? ''} rowStyles={rowStyles} />
            <Row icon="location-outline" label="Адрес" value={booking.rooms?.address ?? ''} rowStyles={rowStyles} />
            <Row icon="calendar-outline" label="Дата" value={dateFormatted} rowStyles={rowStyles} />
            <Row icon="time-outline" label="Время" value={booking.time_slot.slice(0, 5)} rowStyles={rowStyles} />
            <Row icon="people-outline" label="Игроки" value={`${booking.players_count} чел`} rowStyles={rowStyles} />
            <Row
              icon="cash-outline"
              label="Стоимость"
              value={`${price.toLocaleString('ru-RU')} ₽`}
              last
              rowStyles={rowStyles}
            />
          </View>

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

      {showConfetti && <ConfettiCelebration />}
    </SafeAreaView>
  );
}

function Row({ icon, label, value, last, rowStyles }: {
  icon: string; label: string; value: string; last?: boolean;
  rowStyles: ReturnType<typeof makeRowStyles>;
}) {
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
    container:   { flex: 1, backgroundColor: C.background },
    centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },
    content:     { padding: 24, alignItems: 'center', gap: 16 },
    icon:        { marginTop: 16 },
    title:       { fontSize: 26, fontWeight: '800', color: C.text, textAlign: 'center', lineHeight: 34 },
    subtitle:    { fontSize: 15, color: C.textLight },

    statusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    },
    statusDot:   { width: 8, height: 8, borderRadius: 4 },
    statusText:  { fontSize: 14, fontWeight: '700' },

    pendingHint: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      backgroundColor: C.white, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: C.border, width: '100%',
    },
    pendingHintText: { fontSize: 13, color: C.textLight, flex: 1, lineHeight: 19 },

    card: {
      backgroundColor: C.white, borderRadius: 16, padding: 16,
      width: '100%', borderWidth: 1, borderColor: C.border,
    },
    footer:         { padding: 20, gap: 12 },
    primaryBtn:     { backgroundColor: C.primary, borderRadius: 14, padding: 17, alignItems: 'center' },
    primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    secondaryBtn: {
      backgroundColor: C.white, borderRadius: 14, padding: 17, alignItems: 'center',
      borderWidth: 1.5, borderColor: C.border,
    },
    secondaryBtnText: { color: C.text, fontSize: 16, fontWeight: '600' },
  });
}
