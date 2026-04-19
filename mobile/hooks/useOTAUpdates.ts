import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { Alert } from 'react-native';

export function useOTAUpdates() {
  useEffect(() => {
    if (!Updates.isEnabled || __DEV__) return;

    let cancelled = false;

    async function checkForUpdates() {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (cancelled || !result.isAvailable) return;

        await Updates.fetchUpdateAsync();
        if (cancelled) return;

        Alert.alert(
          'Atualização disponível',
          'Uma nova versão foi baixada. Reinicie o app para aplicar.',
          [
            { text: 'Depois', style: 'cancel' },
            { text: 'Reiniciar', onPress: () => Updates.reloadAsync() },
          ],
        );
      } catch {
        // silencia falhas (sem rede, sem update publicado, etc.)
      }
    }

    checkForUpdates();

    return () => {
      cancelled = true;
    };
  }, []);
}
