/* eslint-disable */
/**
 * Dispara dois eventos no Firebase RTDB pra testar as notificações locais do app:
 *   1) alarm_active: false -> true -> false (dispara "Intrusão detectada")
 *   2) cria um novo intrusion_event com acknowledged=false (dispara "Novo evento")
 *
 * Uso:
 *   cd mobile
 *   node --env-file=.env scripts/test-notifications.js
 *
 * Requisitos: app aberto no Expo Go + permissão de notificação concedida.
 *             Node 20.6+ (pra suportar a flag --env-file).
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update, set } = require('firebase/database');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
};

const DEVICE_ID = 'esp32-datacenter-001';
const CURRENT_PATH = `datacenter/devices/${DEVICE_ID}/current`;
const EVENTS_PATH = `datacenter/intrusion_events/${DEVICE_ID}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  console.log('[1/3] Setando alarm_active = true (deve disparar "Intrusão detectada")...');
  await update(ref(db, CURRENT_PATH), {
    alarm_active: true,
    timestamp: Date.now(),
  });
  console.log('      ✓ alarm_active = true');

  await sleep(5000);

  console.log('[2/3] Criando novo evento de intrusão (deve disparar "Novo evento")...');
  const eventId = `test-${Date.now()}`;
  await set(ref(db, `${EVENTS_PATH}/${eventId}`), {
    event_type: 'motion_detected',
    description: 'Evento de teste gerado pelo script',
    acknowledged: false,
    timestamp: Date.now(),
  });
  console.log(`      ✓ evento criado: ${eventId}`);

  await sleep(5000);

  console.log('[3/3] Voltando alarm_active para false...');
  await update(ref(db, CURRENT_PATH), {
    alarm_active: false,
    timestamp: Date.now(),
  });
  console.log('      ✓ alarm_active = false');

  console.log('\nConcluído. Confira o celular:');
  console.log('  - 2 notificações devem ter aparecido');
  console.log('  - 1 novo evento na aba Intrusão');
  console.log('  - Dashboard card Alarme voltou pra "OK"');
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
