import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Оранжевый → розовый → фиолетовый
const GRADIENT: [string, string, string] = ['#FF6B35', '#E91E8C', '#6A1B9A'];

const STARS = [
  { xFrac: 0.06, delay: 0,    duration: 4200, emoji: '⭐', size: 22 },
  { xFrac: 0.18, delay: 700,  duration: 3600, emoji: '✨', size: 16 },
  { xFrac: 0.29, delay: 1400, duration: 5000, emoji: '🌟', size: 26 },
  { xFrac: 0.41, delay: 300,  duration: 3900, emoji: '⭐', size: 18 },
  { xFrac: 0.54, delay: 1100, duration: 4600, emoji: '✨', size: 14 },
  { xFrac: 0.65, delay: 550,  duration: 3400, emoji: '🌟', size: 20 },
  { xFrac: 0.76, delay: 1700, duration: 4300, emoji: '⭐', size: 24 },
  { xFrac: 0.87, delay: 900,  duration: 3800, emoji: '✨', size: 18 },
  { xFrac: 0.94, delay: 200,  duration: 4800, emoji: '🌟', size: 16 },
];

function FallingStar({ xFrac, delay, duration, emoji, size }: typeof STARS[0]) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: height + 80,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.85, duration: 400, useNativeDriver: true }),
            Animated.delay(duration - 800),
            Animated.timing(opacity, { toValue: 0,    duration: 400, useNativeDriver: true }),
          ]),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: xFrac * width,
        top: 0,
        fontSize: size,
        opacity,
        transform: [{ translateY }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

function PulsingDot({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scale, { toValue: 1.7, duration: 320, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 320, useNativeDriver: true }),
        Animated.delay(640 - delay),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return <Animated.View style={[styles.dot, { transform: [{ scale }] }]} />;
}

export function LoadingScreen() {
  const bounce = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 550, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -22, duration: 460, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,   duration: 460, useNativeDriver: true }),
        Animated.delay(180),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient colors={GRADIENT} style={styles.gradient} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}>
      {/* Падающие звёздочки */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STARS.map((s, i) => <FallingStar key={i} {...s} />)}
      </View>

      {/* Основной контент */}
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        <Animated.Text style={[styles.emoji, { transform: [{ translateY: bounce }] }]}>
          🎪
        </Animated.Text>

        <Text style={styles.title}>КвестРум</Text>

        <Text style={styles.subtitle}>Ищем лучшие игровые комнаты…</Text>

        <View style={styles.dots}>
          <PulsingDot delay={0} />
          <PulsingDot delay={200} />
          <PulsingDot delay={400} />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:  { alignItems: 'center', gap: 10 },
  emoji:    { fontSize: 96, marginBottom: 8 },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.80)',
    marginTop: 2,
  },
  dots: { flexDirection: 'row', gap: 10, marginTop: 32 },
  dot:  { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.75)' },
});
