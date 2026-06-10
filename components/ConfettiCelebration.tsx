import { StyleSheet, View, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

const COLORS = [
  '#FF6B35', '#FFD700', '#FF69B4', '#00CED1',
  '#FF4500', '#7B68EE', '#32CD32', '#FF1493',
  '#FFA500', '#40E0D0', '#FF6347', '#9370DB',
];

export function ConfettiCelebration() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Левая хлопушка */}
      <ConfettiCannon
        count={140}
        origin={{ x: 0, y: -20 }}
        colors={COLORS}
        autoStart
        fadeOut
        fallSpeed={3200}
        explosionSpeed={380}
      />
      {/* Центральная хлопушка */}
      <ConfettiCannon
        count={100}
        origin={{ x: width / 2, y: -20 }}
        colors={COLORS}
        autoStart
        fadeOut
        fallSpeed={3500}
        explosionSpeed={420}
      />
      {/* Правая хлопушка */}
      <ConfettiCannon
        count={140}
        origin={{ x: width + 20, y: -20 }}
        colors={COLORS}
        autoStart
        fadeOut
        fallSpeed={3200}
        explosionSpeed={380}
      />
    </View>
  );
}
