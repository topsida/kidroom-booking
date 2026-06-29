import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '@/types';
import { useTheme } from '@/context/ThemeContext';

// Web-заглушка — react-native-maps не поддерживает браузер.
// На iOS/Android используется RoomsMap.native.tsx.
export function RoomsMap({ rooms: _ }: { rooms: Room[] }) {
  const { colors: C } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <Ionicons name="map-outline" size={48} color={C.textLight} />
      <Text style={{ color: C.textLight, fontSize: 15 }}>
        Карта доступна в мобильном приложении
      </Text>
    </View>
  );
}
