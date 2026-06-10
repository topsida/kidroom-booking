import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { sendTelegramMessage, ownerCancellationNotificationText } from '@/lib/telegram';
import { Booking } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { BookingCard } from '@/components/BookingCard';

type Tab = 'active' | 'past';

export default function BookingsScreen() {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('active');

  useFocusEffect(useCallback(() => { loadBookings(); }, []));

  async function loadBookings() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('bookings')
      .select('*, rooms(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    setBookings(data ?? []);
    setLoading(false);
  }

  async function cancelBooking(id: string) {
    const booking = bookings.find(b => b.id === id);

    if (booking?.rooms?.owner_telegram_chat_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users').select('name, phone').eq('id', user.id).single();
        const dateFormatted = new Date(booking.date).toLocaleDateString('ru-RU', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
        await sendTelegramMessage(
          booking.rooms.owner_telegram_chat_id,
          ownerCancellationNotificationText({
            roomName: booking.rooms.name,
            clientName: profile?.name ?? '',
            phone: profile?.phone ?? '',
            date: dateFormatted,
            time: booking.time_slot.slice(0, 5),
          })
        );
      }
    }

    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    loadBookings();
  }

  const today = new Date().toISOString().split('T')[0];
  const active = bookings.filter(b => b.date >= today && b.status !== 'cancelled');
  const past = bookings.filter(b => b.date < today || b.status === 'cancelled');
  const shown = tab === 'active' ? active : past;

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Мои бронирования</Text>

      <View style={styles.tabs}>
        {(['active', 'past'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'active'
                ? `Активные${active.length ? ` (${active.length})` : ''}`
                : `Прошедшие${past.length ? ` (${past.length})` : ''}`
              }
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={shown}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onCancel={tab === 'active' && item.status !== 'cancelled' ? () => cancelBooking(item.id) : undefined}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBookings} tintColor={C.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{tab === 'active' ? '📅' : '🗂️'}</Text>
            <Text style={styles.emptyTitle}>{tab === 'active' ? 'Нет активных броней' : 'Нет прошедших броней'}</Text>
            {tab === 'active' && <Text style={styles.emptyHint}>Выберите комнату на главной</Text>}
          </View>
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },
    title: { fontSize: 24, fontWeight: '800', color: C.text, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
    tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 14 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
    tabActive: { backgroundColor: C.primary, borderColor: C.primary },
    tabText: { color: C.textLight, fontWeight: '600', fontSize: 13 },
    tabTextActive: { color: '#FFFFFF' },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    empty: { alignItems: 'center', paddingTop: 70, gap: 10 },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
    emptyHint: { color: C.textLight, fontSize: 14 },
  });
}
