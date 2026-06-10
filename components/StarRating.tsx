import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  value: number;
  size?: number;
  onSelect?: (rating: number) => void; // если задан — звёзды кликабельны
}

export function StarRating({ value, size = 16, onSelect }: Props) {
  const { colors: C } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: onSelect ? 6 : 2 }}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= (onSelect ? value : Math.round(value));
        const icon = filled ? 'star' : 'star-outline';
        const color = filled ? C.star : (onSelect ? '#D1D5DB' : C.border);

        if (onSelect) {
          return (
            <TouchableOpacity key={i} onPress={() => onSelect(i)} hitSlop={6} activeOpacity={0.7}>
              <Ionicons name={icon} size={size} color={color} />
            </TouchableOpacity>
          );
        }
        return <Ionicons key={i} name={icon} size={size} color={color} />;
      })}
    </View>
  );
}
