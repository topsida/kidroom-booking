import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="room/[id]"
          options={{ headerShown: true, title: 'Комната', headerTintColor: Colors.primary, headerBackTitle: 'Назад' }}
        />
        <Stack.Screen
          name="booking/[roomId]"
          options={{ headerShown: true, title: 'Бронирование', headerTintColor: Colors.primary, headerBackTitle: 'Назад' }}
        />
        <Stack.Screen
          name="confirmation/[bookingId]"
          options={{ headerShown: true, title: 'Подтверждение', headerTintColor: Colors.primary, headerBackVisible: false }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
