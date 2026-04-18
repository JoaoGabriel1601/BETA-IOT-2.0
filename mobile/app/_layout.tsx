import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useAlertNotifications } from '@/hooks/useAlertNotifications';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme/colors';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate() {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useAlertNotifications();

  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === '(tabs)';
    if (!user && inAuthGroup) {
      router.replace('/login');
    } else if (user && segments[0] === 'login') {
      router.replace('/(tabs)');
    }
  }, [user, initializing, segments, router]);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg1 }}>
        <ActivityIndicator color={colors.brand2} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg1 } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <AuthGate />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
