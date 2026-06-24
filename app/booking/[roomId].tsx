import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Room } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { localDateStr } from '@/lib/pricing';

LocaleConfig.locales['ru'] = {
  monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  monthNamesShort: ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'],
  dayNames: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
  dayNamesShort: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
  today: 'Сегодня',
};
LocaleConfig.defaultLocale = 'ru';

export default function BookingScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [playersCount, setPlayersCount] = useState(2);
  const [loading, setLoading] = useState(false);

  const today = localDateStr();

  useEffect(() => {
    supabase.from('rooms').select('*').eq('id', roomId).single()
      .then(({ data }) => {
        setRoom(data);
        if (data?.min_players) setPlayersCount(data.min_players);
      });
  }, [roomId]);

  useEffect(() => {
    if (!date) return;
    supabase
      .from('bookings')
      .select('time_slot')
      .eq('room_id', roomId)
      .eq('date', date)
      .neq('status', 'cancelled')
      .then(({ data }) => {
        setBookedSlots((data ?? []).map(b => b.time_slot.slice(0, 5)));
        setTimeSlot('');
      });
  }, [date]);

  async function proceed() {
    if (!date)     { Alert.alert('Выберите дату'); return; }
    if (!timeSlot) { Alert.alert('Выберите время'); return; }

    const minP = room?.min_players ?? 1;
    const maxP = room?.max_players ?? 20;
    if (playersCount < minP || playersCount > maxP) {
      Alert.alert('Неверное количество', `От ${minP} до ${maxP} игроков`);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); Alert.alert('Ошибка', 'Войдите в аккаунт'); return; }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        room_id: roomId,
        date,
        time_slot: timeSlot + ':00',
        players_count: playersCount,
        status: 'confirmed',
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      if (error.code === '23505') { Alert.alert('Слот занят', 'Выберите другое время'); setTimeSlot(''); }
      else Alert.alert('Ошибка', error.message);
      return;
    }

    router.replace({ pathname: '/confirmation/[bookingId]', params: { bookingId: data.id } });
  }

  if (!room) {
    return <View style={styles.centered}><ActivityIndicator color={C.primary} size="large" /></View>;
  }

  const teamPrice = room.price_per_team ?? room.price_per_hour;
  const minP = room.min_players ?? 1;
  const maxP = room.max_players ?? 20;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        {/* Баннер квеста */}
        <View style={styles.roomBanner}>
          <View>
            <Text style={styles.roomName}>{room.name}</Text>
            {room.duration_minutes && (
              <Text style={styles.roomMeta}>⏱ {room.duration_minutes} мин · 👥 {minP}–{maxP} чел</Text>
            )}
          </View>
          <View>
            <Text style={styles.roomPrice}>{teamPrice.toLocaleString('ru-RU')} ₽</Text>
            <Text style={styles.roomPriceLabel}>за команду</Text>
          </View>
        </View>

        {/* 1. Дата */}
        <Text style={styles.step}>1. Выберите дату</Text>
        <Calendar
          onDayPress={day => setDate(day.dateString)}
          markedDates={date ? { [date]: { selected: true, selectedColor: C.primary } } : {}}
          minDate={today}
          theme={{
            todayTextColor: C.primary,
            arrowColor: C.primary,
            textSectionTitleColor: C.textLight,
            selectedDayBackgroundColor: C.primary,
            calendarBackground: C.white,
            dayTextColor: C.text,
            monthTextColor: C.text,
            textDisabledColor: C.border,
          }}
          style={styles.calendar}
        />

        {/* 2. Время */}
        {date && (
          <>
            <Text style={styles.step}>2. Выберите время</Text>
            <TimeSlotPicker
              workStart={room.working_hours_start}
              workEnd={room.working_hours_end}
              bookedSlots={bookedSlots}
              selected={timeSlot}
              onSelect={setTimeSlot}
              date={date}
              basePrice={teamPrice}
              pricingRules={[]}
            />
          </>
        )}

        {/* 3. Количество игроков */}
        <Text style={styles.step}>3. Количество игроков</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={[styles.stepBtn, playersCount <= minP && styles.stepBtnDisabled]}
            onPress={() => setPlayersCount(c => Math.max(minP, c - 1))}
            disabled={playersCount <= minP}
          >
            <Ionicons name="remove" size={22} color={playersCount <= minP ? C.border : C.primary} />
          </TouchableOpacity>
          <View style={styles.stepValueBox}>
            <Text style={styles.stepValue}>{playersCount}</Text>
            <Text style={styles.stepLabel}>чел</Text>
          </View>
          <TouchableOpacity
            style={[styles.stepBtn, playersCount >= maxP && styles.stepBtnDisabled]}
            onPress={() => setPlayersCount(c => Math.min(maxP, c + 1))}
            disabled={playersCount >= maxP}
          >
            <Ionicons name="add" size={22} color={playersCount >= maxP ? C.border : C.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.playersHint}>Допустимо от {minP} до {maxP} игроков</Text>

        {/* Итого */}
        {date && timeSlot && (
          <View style={styles.summary}>
            <View>
              <Text style={styles.summaryLabel}>Итого к оплате</Text>
              <Text style={styles.summaryNote}>{date} в {timeSlot} · {room.duration_minutes ?? 60} мин</Text>
            </View>
            <Text style={styles.summaryPrice}>{teamPrice.toLocaleString('ru-RU')} ₽</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={proceed}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Перейти к подтверждению →</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },
    content: { padding: 20, gap: 14, paddingBottom: 40 },

    roomBanner: {
      backgroundColor: C.primaryLight, borderRadius: 14, padding: 14,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    roomName:       { fontSize: 16, fontWeight: '700', color: C.primary, flex: 1, marginRight: 8 },
    roomMeta:       { fontSize: 13, color: C.primary, opacity: 0.75, marginTop: 2 },
    roomPrice:      { fontSize: 18, fontWeight: '800', color: C.primary, textAlign: 'right' },
    roomPriceLabel: { fontSize: 11, color: C.primary, opacity: 0.7, textAlign: 'right' },

    step:     { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 6 },
    calendar: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },

    // Счётчик игроков
    stepper: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.border,
      paddingVertical: 10, gap: 0,
    },
    stepBtn: {
      width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
    },
    stepBtnDisabled: { opacity: 0.4 },
    stepValueBox: { alignItems: 'center', minWidth: 80 },
    stepValue: { fontSize: 32, fontWeight: '800', color: C.primary, lineHeight: 38 },
    stepLabel: { fontSize: 13, color: C.textLight, marginTop: -2 },
    playersHint: { fontSize: 13, color: C.textLight, textAlign: 'center', marginTop: -6 },

    summary: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: C.white, padding: 16, borderRadius: 14,
      borderWidth: 1.5, borderColor: C.primary,
    },
    summaryLabel: { fontSize: 14, fontWeight: '600', color: C.text },
    summaryNote:  { fontSize: 12, color: C.textLight, marginTop: 2 },
    summaryPrice: { fontSize: 22, fontWeight: '800', color: C.primary },

    btn:        { backgroundColor: C.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 4 },
    btnDisabled:{ opacity: 0.5 },
    btnText:    { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  });
}
