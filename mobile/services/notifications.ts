import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { colors } from '@/theme/colors';

const ALERT_CHANNEL_ID = 'datacenter-alerts';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function ensureNotificationSetup(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALERT_CHANNEL_ID, {
      name: 'Alertas do Datacenter',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors.danger,
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

interface AlertPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendAlert({ title, body, data }: AlertPayload): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: Platform.OS === 'android' ? { channelId: ALERT_CHANNEL_ID } : null,
  });
}

export async function dismissAllAlerts(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}
