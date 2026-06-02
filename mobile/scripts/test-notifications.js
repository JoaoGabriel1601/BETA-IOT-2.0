/* eslint-disable */
/**
 * Dispara um evento de intrusão no canal do ThingSpeak para testar as
 * notificações locais do app (e o dashboard web):
 *   1) envia field7=1 (alarme) + status="motion_detected: ..."
 *      -> dispara "Intrusão detectada" e "Novo evento"
 *   2) ~20s depois, envia field7=0 (alarme limpo)
 *
 * Uso:
 *   cd mobile
 *   THINGSPEAK_WRITE_API_KEY=SUA_WRITE_KEY node scripts/test-notifications.js
 *   (ou adicione THINGSPEAK_WRITE_API_KEY ao .env e rode:
 *    node --env-file=.env scripts/test-notifications.js)
 *
 * Requisitos: app aberto no Expo Go + permissão de notificação concedida.
 *             Node 18+ (fetch nativo). ThingSpeak free: 1 envio a cada 15s.
 */

const WRITE_KEY = process.env.THINGSPEAK_WRITE_API_KEY;
const HOST = 'https://api.thingspeak.com/update';

if (!WRITE_KEY) {
  console.error('Defina THINGSPEAK_WRITE_API_KEY (Write API Key do canal).');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(fields) {
  const params = new URLSearchParams({ api_key: WRITE_KEY, ...fields });
  const res = await fetch(`${HOST}?${params.toString()}`);
  const entry = await res.text();
  if (entry === '0') throw new Error('ThingSpeak rejeitou o envio (limite de 15s?).');
  return entry;
}

async function main() {
  console.log('[1/2] Enviando alarme (field7=1) + status (deve disparar notificações)...');
  const id1 = await send({
    field1: '25.0', field2: '55.0', field3: '70', field4: '127.0',
    field5: '1', field6: '1', field7: '1', field8: '0',
    status: 'motion_detected: Evento de teste gerado pelo script',
  });
  console.log(`      ✓ entry #${id1}`);

  console.log('[2/2] Aguardando 20s (limite do ThingSpeak) e limpando o alarme...');
  await sleep(20000);
  const id2 = await send({
    field1: '25.0', field2: '55.0', field3: '70', field4: '127.0',
    field5: '0', field6: '1', field7: '0', field8: '20',
  });
  console.log(`      ✓ entry #${id2}`);

  console.log('\nConcluído. Confira o celular e o dashboard:');
  console.log('  - notificação "Intrusão detectada" deve ter aparecido');
  console.log('  - 1 novo evento na aba Intrusão (motion_detected)');
  console.log('  - card Alarme volta para "OK" após o 2º envio');
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
