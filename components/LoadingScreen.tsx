import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import { useFonts, Creepster_400Regular } from '@expo-google-fonts/creepster';

function PulsingDot({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scale, { toValue: 1.7, duration: 320, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 320, useNativeDriver: true }),
        Animated.delay(960 - delay),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return <Animated.View style={[styles.dot, { transform: [{ scale }] }]} />;
}

export function LoadingScreen() {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [fontsLoaded] = useFonts({ Creepster_400Regular });

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const titleFont = fontsLoaded ? 'Creepster_400Regular' : undefined;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        <Image
          source={require('../assets/logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.titleRow}>
          <Text style={[styles.titleQuest, { fontFamily: titleFont }]}>Quest</Text>
          <Text style={[styles.titlePoint, { fontFamily: titleFont }]}>Flow</Text>
        </View>

        <Text style={styles.subtitle}>Бронируй квесты</Text>

        <View style={styles.dots}>
          <PulsingDot delay={0} />
          <PulsingDot delay={200} />
          <PulsingDot delay={400} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
  },
  titleQuest: {
    fontSize: 36,
    color: '#1D9E75',
    letterSpacing: 1,
  },
  titlePoint: {
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    marginTop: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1D9E75',
  },
});
