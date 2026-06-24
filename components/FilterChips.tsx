import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { RoomFilters, Genre, Difficulty, AgeLimit, IsScary } from '@/types';
import { ThemeColors } from '@/context/ThemeContext';

interface Props {
  filters: RoomFilters;
  onChange: (f: RoomFilters) => void;
  colors: ThemeColors;
}

const GROUPS: {
  key: keyof RoomFilters;
  emoji: string;
  title: string;
  chips: { id: any; label: string }[];
}[] = [
  {
    key: 'genre', emoji: '🎭', title: 'Жанр',
    chips: [
      { id: 'хоррор'      as Genre, label: '👻 Хоррор'      },
      { id: 'детектив'    as Genre, label: '🔍 Детектив'    },
      { id: 'приключение' as Genre, label: '⚔️ Приключение' },
      { id: 'детский'     as Genre, label: '🎈 Детский'     },
      { id: 'VR'          as Genre, label: '🥽 VR'          },
      { id: 'перформанс'  as Genre, label: '🎭 Перформанс'  },
    ],
  },
  {
    key: 'difficulty', emoji: '🏆', title: 'Сложность',
    chips: [
      { id: 'новичок' as Difficulty, label: '🟢 Новичок' },
      { id: 'средний' as Difficulty, label: '🟡 Средний' },
      { id: 'опытный' as Difficulty, label: '🔴 Опытный' },
    ],
  },
  {
    key: 'age_limit', emoji: '🔞', title: 'Возраст',
    chips: [
      { id: '6+'  as AgeLimit, label: '6+'  },
      { id: '12+' as AgeLimit, label: '12+' },
      { id: '16+' as AgeLimit, label: '16+' },
      { id: '18+' as AgeLimit, label: '18+' },
    ],
  },
  {
    key: 'players', emoji: '👥', title: 'Количество игроков',
    chips: [
      { id: '1-2', label: '1–2 чел' },
      { id: '3-4', label: '3–4 чел' },
      { id: '5+',  label: '5+ чел'  },
    ],
  },
  {
    key: 'has_actor', emoji: '🎬', title: 'Актёр',
    chips: [
      { id: 'да',  label: '🎭 С актёром'  },
      { id: 'нет', label: 'Без актёра' },
    ],
  },
  {
    key: 'is_scary', emoji: '👻', title: 'Страшность',
    chips: [
      { id: 'нет'     as IsScary, label: '😊 Не страшно'       },
      { id: 'немного' as IsScary, label: '😨 Немного страшно' },
      { id: 'хоррор'  as IsScary, label: '💀 Хоррор'          },
    ],
  },
];

export function FilterChips({ filters, onChange, colors: C }: Props) {
  const s = makeStyles(C);

  function toggle(key: keyof RoomFilters, value: any) {
    onChange({ ...filters, [key]: filters[key] === value ? null : value });
  }

  return (
    <ScrollView
      style={s.scroll}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <View style={s.wrapper}>
        {GROUPS.map(group => (
          <View key={group.key} style={s.group}>
            <Text style={s.groupTitle}>{group.emoji} {group.title}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chips}
              nestedScrollEnabled
            >
              {group.chips.map(chip => {
                const active = filters[group.key] === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    style={[s.chip, active && { backgroundColor: C.primary, borderColor: C.primary }]}
                    onPress={() => toggle(group.key, chip.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.chipText, active && s.chipActive]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    scroll:    { maxHeight: 380 },
    wrapper:   { gap: 16, paddingBottom: 8 },
    group:     { gap: 10 },
    groupTitle:{ fontSize: 14, fontWeight: '700', color: C.text, paddingHorizontal: 20 },
    chips:     { gap: 8, paddingHorizontal: 20 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.white,
    },
    chipText:   { fontSize: 14, fontWeight: '600', color: C.text },
    chipActive: { color: '#fff' },
  });
}
