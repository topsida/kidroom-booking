import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const DOT_COLORS = ['#FF6B35', '#FFD700', '#FF69B4'];

function PulsingDot({ color, delay }: { color: string; delay: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scale, { toValue: 1.6, duration: 350, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.delay(650 - delay),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: color, transform: [{ scale }] }]}
    />
  );
}

export function LoadingScreen() {
  const { colors: C } = useTheme();
  const bounce = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -18, duration: 480, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,   duration: 480, useNativeDriver: true }),
        Animated.delay(200),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <Animated.Text
        style={[styles.emoji, { opacity: fadeIn, transform: [{ translateY: bounce }] }]}
      >
        🎪
      </Animated.Text>

      <Animated.Text style={[styles.title, { color: C.primary, opacity: fadeIn }]}>
        КидРум
      </Animated.Text>

      <Animated.Text style={[styles.subtitle, { color: C.textLight, opacity: fadeIn }]}>
        Ищем лучшие игровые комнаты…
      </Animated.Text>

      <Animated.View style={[styles.dots, { opacity: fadeIn }]}>
        {DOT_COLORS.map((color, i) => (
          <PulsingDot key={color} color={color} delay={i * 200} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emoji:    { fontSize: 80, marginBottom: 4 },
  title:    { fontSize: 34, fontWeight: '900', letterSpacing: 1 },
  subtitle: { fontSize: 15, marginTop: 4 },
  dots:     { flexDirection: 'row', gap: 10, marginTop: 28 },
  dot:      { width: 14, height: 14, borderRadius: 7 },
});
