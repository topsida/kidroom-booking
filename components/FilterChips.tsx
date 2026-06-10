import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { RoomFilters } from '@/types';
import { ThemeColors } from '@/context/ThemeContext';

interface Props {
  filters: RoomFilters;
  onChange: (f: RoomFilters) => void;
  colors: ThemeColors;
}

const PRICE_CHIPS: { id: RoomFilters['price']; label: string }[] = [
  { id: 'lt500',      label: 'до 500 ₽'    },
  { id: '500to1000',  label: '500–1000 ₽'  },
  { id: 'gt1000',     label: 'от 1000 ₽'   },
];

const AGE_CHIPS: { id: RoomFilters['age']; label: string }[] = [
  { id: 'lt3',   label: '👶 до 3 лет' },
  { id: '3to7',  label: '🧒 3–7 лет'  },
  { id: 'gt7',   label: '🧑 7+ лет'   },
];

const RATING_CHIPS: { id: RoomFilters['rating']; label: string }[] = [
  { id: '4.5', label: '⭐ 4.5+' },
  { id: '4.0', label: '⭐ 4.0+' },
];

export function FilterChips({ filters, onChange, colors: C }: Props) {
  const s = makeStyles(C);

  function toggle<K extends keyof RoomFilters>(key: K, value: RoomFilters[K]) {
    onChange({ ...filters, [key]: filters[key] === value ? null : value });
  }

  const anyActive = filters.price || filters.age || filters.rating;

  return (
    <View style={s.wrapper}>
      {/* Строка 1 — Цена */}
      <View style={s.row}>
        <Text style={s.label}>💰</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {PRICE_CHIPS.map(chip => {
            const active = filters.price === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[s.chip, active && { backgroundColor: C.primary, borderColor: C.primary }]}
                onPress={() => toggle('price', chip.id)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{chip.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Строка 2 — Возраст */}
      <View style={s.row}>
        <Text style={s.label}>🎠</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {AGE_CHIPS.map(chip => {
            const active = filters.age === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[s.chip, active && { backgroundColor: C.primary, borderColor: C.primary }]}
                onPress={() => toggle('age', chip.id)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{chip.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Строка 3 — Рейтинг + сброс */}
      <View style={s.row}>
        <Text style={s.label}>🏆</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {RATING_CHIPS.map(chip => {
            const active = filters.rating === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[s.chip, active && { backgroundColor: C.primary, borderColor: C.primary }]}
                onPress={() => toggle('rating', chip.id)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{chip.label}</Text>
              </TouchableOpacity>
            );
          })}

          {anyActive && (
            <TouchableOpacity
              style={[s.chip, s.chipReset]}
              onPress={() => onChange({ price: null, age: null, rating: null })}
              activeOpacity={0.75}
            >
              <Text style={[s.chipText, { color: C.error }]}>✕ Сбросить</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    wrapper: { gap: 6, marginBottom: 8 },
    row:     { flexDirection: 'row', alignItems: 'center', paddingLeft: 20 },
    label:   { fontSize: 16, marginRight: 6, width: 24 },
    scroll:  { gap: 8, paddingRight: 20 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.white,
    },
    chipReset: { borderColor: C.error, backgroundColor: '#FFF5F5' },
    chipText:       { fontSize: 13, fontWeight: '600', color: C.text },
    chipTextActive: { color: '#fff' },
  });
}
