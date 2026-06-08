import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= Math.round(value) ? 'star' : 'star-outline'}
          size={size}
          color={Colors.star}
        />
      ))}
    </View>
  );
}
