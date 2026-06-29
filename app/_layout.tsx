import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerPushToken() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    const { data: { user } } = await supabase.auth.getUser();
    if (user && token) {
      await supabase.from('users').update({ push_token: token }).eq('id', user.id);
    }
  } catch (e) {
    console.warn('Push token error:', e);
  }
}

function RootContent() {
  const { session, loading } = useAuth();
  const { colors, isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [minLoadDone, setMinLoadDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinLoadDone(true), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading || !minLoadDone) return;
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, loading, minLoadDone, segments]);

  useEffect(() => {
    if (session) registerPushToken();
  }, [session]);

  if (loading || !minLoadDone) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="room/[id]"
          options={{ headerShown: true, title: 'Комната', headerTintColor: colors.primary, headerBackTitle: 'Назад', headerStyle: { backgroundColor: colors.header }, headerTitleStyle: { color: colors.text } }}
        />
        <Stack.Screen
          name="booking/[roomId]"
          options={{ headerShown: true, title: 'Бронирование', headerTintColor: colors.primary, headerBackTitle: 'Назад', headerStyle: { backgroundColor: colors.header }, headerTitleStyle: { color: colors.text } }}
        />
        <Stack.Screen
          name="confirmation/[bookingId]"
          options={{ headerShown: true, title: 'Подтверждение', headerTintColor: colors.primary, headerBackVisible: false, headerStyle: { backgroundColor: colors.header }, headerTitleStyle: { color: colors.text } }}
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FavoritesProvider>
          <RootContent />
        </FavoritesProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
