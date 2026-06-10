import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { RoomFilters } from '@/types';
import { ThemeColors } from '@/context/ThemeContext';

interface Props {
  filters: RoomFilters;
  onChange: (f: RoomFilters) => void;
  colors: ThemeColors;
}

const PRICE_CHIPS: { id: RoomFilters['price']; label: string }[] = [
  { id: 'lt500',     label: 'до 500 ₽'   },
  { id: '500to1000', label: '500–1000 ₽' },
  { id: 'gt1000',    label: 'от 1000 ₽'  },
];

const AGE_CHIPS: { id: RoomFilters['age']; label: string }[] = [
  { id: 'lt3',  label: '👶 до 3 лет' },
  { id: '3to7', label: '🧒 3–7 лет'  },
  { id: 'gt7',  label: '🧑 7+ лет'   },
];

const RATING_CHIPS: { id: RoomFilters['rating']; label: string }[] = [
  { id: '4.5', label: '⭐ 4.5+' },
  { id: '4.0', label: '⭐ 4.0+' },
];

const GROUPS = [
  { key: 'price'  as const, emoji: '💰', title: 'Цена',    chips: PRICE_CHIPS  },
  { key: 'age'    as const, emoji: '🎠', title: 'Возраст', chips: AGE_CHIPS    },
  { key: 'rating' as const, emoji: '🏆', title: 'Рейтинг', chips: RATING_CHIPS },
];

export function FilterChips({ filters, onChange, colors: C }: Props) {
  const s = makeStyles(C);

  function toggle<K extends keyof RoomFilters>(key: K, value: RoomFilters[K]) {
    onChange({ ...filters, [key]: filters[key] === value ? null : value });
  }

  return (
    <View style={s.wrapper}>
      {GROUPS.map(group => (
        <View key={group.key} style={s.group}>
          <Text style={s.groupTitle}>{group.emoji} {group.title}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.scroll}
          >
            {(group.chips as { id: any; label: string }[]).map(chip => {
              const active = filters[group.key] === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[s.chip, active && { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => toggle(group.key, chip.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    wrapper:    { gap: 16 },
    group:      { gap: 10 },
    groupTitle: { fontSize: 14, fontWeight: '700', color: C.text, paddingHorizontal: 20 },
    scroll:     { gap: 8, paddingHorizontal: 20 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.white,
    },
    chipText:       { fontSize: 14, fontWeight: '600', color: C.text },
    chipTextActive: { color: '#fff' },
  });
}
