import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LoadingScreen } from '@/components/LoadingScreen';

function RootContent() {
  const { session, loading } = useAuth();
  const { colors, theme } = useTheme();
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
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="room/[id]"
          options={{ headerShown: true, title: 'Комната', headerTintColor: colors.primary, headerBackTitle: 'Назад', headerStyle: { backgroundColor: colors.background }, headerTitleStyle: { color: colors.text } }}
        />
        <Stack.Screen
          name="booking/[roomId]"
          options={{ headerShown: true, title: 'Бронирование', headerTintColor: colors.primary, headerBackTitle: 'Назад', headerStyle: { backgroundColor: colors.background }, headerTitleStyle: { color: colors.text } }}
        />
        <Stack.Screen
          name="confirmation/[bookingId]"
          options={{ headerShown: true, title: 'Подтверждение', headerTintColor: colors.primary, headerBackVisible: false, headerStyle: { backgroundColor: colors.background }, headerTitleStyle: { color: colors.text } }}
        />
      </Stack>
      <StatusBar style={theme.id === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
