import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { supabase } from '@/lib/supabase';
import { Room, PricingRule } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { getSlotPrice, localDateStr } from '@/lib/pricing';

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

  const [room, setRoom] = useState<Room | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const today = localDateStr();

  useEffect(() => {
    supabase.from('rooms').select('*').eq('id', roomId).single()
      .then(({ data }) => setRoom(data));

    supabase.from('pricing_rules')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_active', true)
      .then(({ data }) => setPricingRules(data ?? []));
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
    if (!date) { Alert.alert('Выберите дату'); return; }
    if (!timeSlot) { Alert.alert('Выберите время'); return; }
    if (!childName.trim()) { Alert.alert('Введите имя ребёнка'); return; }
    const age = parseInt(childAge, 10);
    if (!age || age < 1 || age > 18) { Alert.alert('Укажите возраст от 1 до 18 лет'); return; }

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
        child_name: childName.trim(),
        child_age: age,
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

  const slotPrice = date && timeSlot
    ? getSlotPrice(room.price_per_hour, timeSlot, date, pricingRules)
    : null;
  const hasModifier = slotPrice !== null && slotPrice !== room.price_per_hour;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Баннер комнаты */}
        <View style={styles.roomBanner}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomPrice}>{room.price_per_hour} ₽/час</Text>
        </View>

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

        {date && (
          <>
            <Text style={styles.step}>2. Выберите время</Text>
            {pricingRules.length > 0 && (
              <View style={styles.pricingHint}>
                <Text style={styles.pricingHintText}>
                  💰 Цена зависит от времени — смотрите стоимость в каждом слоте
                </Text>
              </View>
            )}
            <TimeSlotPicker
              workStart={room.working_hours_start}
              workEnd={room.working_hours_end}
              bookedSlots={bookedSlots}
              selected={timeSlot}
              onSelect={setTimeSlot}
              date={date}
              basePrice={room.price_per_hour}
              pricingRules={pricingRules}
            />
          </>
        )}

        <Text style={styles.step}>3. Данные ребёнка</Text>
        <TextInput
          style={styles.input}
          placeholder="Имя ребёнка"
          value={childName}
          onChangeText={setChildName}
          placeholderTextColor={C.textLight}
        />
        <TextInput
          style={styles.input}
          placeholder="Возраст (лет)"
          value={childAge}
          onChangeText={setChildAge}
          keyboardType="number-pad"
          maxLength={2}
          placeholderTextColor={C.textLight}
        />

        {date && timeSlot && slotPrice !== null && (
          <View style={styles.summary}>
            <View>
              <Text style={styles.summaryLabel}>Итого к оплате</Text>
              <Text style={styles.summaryNote}>{date} в {timeSlot} · 1 час</Text>
            </View>
            <View style={styles.summaryPriceCol}>
              <Text style={styles.summaryPrice}>{slotPrice} ₽</Text>
              {hasModifier && (
                <Text style={styles.summaryBasePrice}>{room.price_per_hour} ₽</Text>
              )}
            </View>
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

    roomBanner: { backgroundColor: C.primaryLight, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    roomName: { fontSize: 16, fontWeight: '700', color: C.primary, flex: 1 },
    roomPrice: { fontSize: 16, fontWeight: '700', color: C.primary },

    step: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 6 },
    calendar: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },

    pricingHint: { backgroundColor: '#FFF9E6', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#FDE68A' },
    pricingHintText: { fontSize: 13, color: '#92400E' },

    input: { backgroundColor: C.white, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1.5, borderColor: C.border, color: C.text },

    summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.white, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: C.primary },
    summaryLabel: { fontSize: 14, fontWeight: '600', color: C.text },
    summaryNote: { fontSize: 12, color: C.textLight, marginTop: 2 },
    summaryPriceCol: { alignItems: 'flex-end' },
    summaryPrice: { fontSize: 22, fontWeight: '800', color: C.primary },
    summaryBasePrice: { fontSize: 13, color: C.textLight, textDecorationLine: 'line-through' },

    btn: { backgroundColor: C.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 4 },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  });
}
