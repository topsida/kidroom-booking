import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Quest, Room } from '@/types';
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
  const { questId } = useLocalSearchParams<{ questId: string }>();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [org, setOrg] = useState<Room | null>(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [playersCount, setPlayersCount] = useState(2);
  const [loading, setLoading] = useState(false);

  const today = localDateStr();

  useEffect(() => {
    async function load() {
      const { data: q } = await supabase
        .from('quests').select('*').eq('id', questId).single();
      if (!q) return;
      setQuest(q);
      setPlayersCount(q.min_players ?? 2);

      const { data: r } = await supabase
        .from('rooms').select('*').eq('id', q.room_id).single();
      setOrg(r);
    }
    load();
  }, [questId]);

  useEffect(() => {
    if (!date || !questId) return;
    supabase
      .from('bookings')
      .select('time_slot')
      .eq('quest_id', questId)
      .eq('date', date)
      .neq('status', 'cancelled')
      .then(({ data }) => {
        setBookedSlots((data ?? []).map(b => b.time_slot.slice(0, 5)));
        setTimeSlot('');
      });
  }, [date, questId]);

  async function proceed() {
    if (!date)     { Alert.alert('Выберите дату'); return; }
    if (!timeSlot) { Alert.alert('Выберите время'); return; }
    if (!quest || !org) return;

    const minP = quest.min_players ?? 1;
    const maxP = quest.max_players ?? 20;
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
        user_id:      user.id,
        room_id:      org.id,
        quest_id:     questId,
        date,
        time_slot:    timeSlot + ':00',
        players_count: playersCount,
        status:       'confirmed',
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

  if (!quest || !org) {
    return <View style={styles.centered}><ActivityIndicator color={C.primary} size="large" /></View>;
  }

  const minP = quest.min_players ?? 1;
  const maxP = quest.max_players ?? 20;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        {/* Баннер: квест + организация */}
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerOrg} numberOfLines={1}>{org.name}</Text>
            <Text style={styles.bannerQuest} numberOfLines={1}>{quest.name}</Text>
            {quest.duration_minutes != null && (
              <Text style={styles.bannerMeta}>
                ⏱ {quest.duration_minutes} мин · 👥 {minP}–{maxP} чел
              </Text>
            )}
          </View>
          <View style={styles.bannerRight}>
            <Text style={styles.bannerPrice}>{quest.price_per_team.toLocaleString('ru-RU')} ₽</Text>
            <Text style={styles.bannerPriceLabel}>за команду</Text>
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
              workStart={org.working_hours_start}
              workEnd={org.working_hours_end}
              bookedSlots={bookedSlots}
              selected={timeSlot}
              onSelect={setTimeSlot}
              date={date}
              basePrice={quest.price_per_team}
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
              <Text style={styles.summaryNote}>
                {date} в {timeSlot} · {quest.duration_minutes ?? 60} мин
              </Text>
            </View>
            <Text style={styles.summaryPrice}>{quest.price_per_team.toLocaleString('ru-RU')} ₽</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={proceed}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Подтвердить бронь →</Text>
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

    banner: {
      backgroundColor: C.primaryLight, borderRadius: 14, padding: 14,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    bannerLeft: { flex: 1, marginRight: 8 },
    bannerOrg: { fontSize: 12, color: C.primary, opacity: 0.75, fontWeight: '600', marginBottom: 2 },
    bannerQuest: { fontSize: 17, fontWeight: '800', color: C.primary },
    bannerMeta: { fontSize: 13, color: C.primary, opacity: 0.7, marginTop: 3 },
    bannerRight: { alignItems: 'flex-end' },
    bannerPrice: { fontSize: 20, fontWeight: '800', color: C.primary },
    bannerPriceLabel: { fontSize: 11, color: C.primary, opacity: 0.7 },

    step: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 6 },
    calendar: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },

    stepper: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.border,
      paddingVertical: 10,
    },
    stepBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
    stepBtnDisabled: { opacity: 0.4 },
    stepValueBox: { alignItems: 'center', minWidth: 80 },
    stepValue: { fontSize: 32, fontWeight: '800', color: C.primary, lineHeight: 38 },
    stepLabel: { fontSize: 13, color: C.textLight, marginTop: -2 },
    playersHint: { fontSize: 13, color: C.textLight, textAlign: 'center', marginTop: -6 },

    summary: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: C.white, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: C.primary,
    },
    summaryLabel: { fontSize: 14, fontWeight: '600', color: C.text },
    summaryNote: { fontSize: 12, color: C.textLight, marginTop: 2 },
    summaryPrice: { fontSize: 22, fontWeight: '800', color: C.primary },

    btn: { backgroundColor: C.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 4 },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
