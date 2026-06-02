import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useAlertNotifications } from '@/hooks/useAlertNotifications';
import { useOTAUpdates } from '@/hooks/useOTAUpdates';
import { colors } from '@/theme/colors';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useAlertNotifications();
  useOTAUpdates();

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg1 } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
