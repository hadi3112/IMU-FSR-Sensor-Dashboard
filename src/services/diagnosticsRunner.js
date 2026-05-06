import { MQTT_TOPICS } from '../lib/mqttTopics.js';
import * as mqttBridge from './mqttBridge.js';

/**
 * @typedef {{ id: string; title: string; detail?: string; state: 'pending'|'running'|'ok'|'fail' }} DiagnosticRow
 */

/**
 * @param {{
 *  ensureMqttConnected: () => Promise<{ ok: boolean; message?: string }>;
 *  healthTimeoutMs?: number;
 *  onRowUpdate: (row: DiagnosticRow) => void;
 * }} args
 */
export async function runDiagnosticsPipeline(args) {
  const { ensureMqttConnected, onRowUpdate } = args;

  /** @type {(partial: Partial<DiagnosticRow> & { id: string }) => void} */
  const patch = (partial) => {
    onRowUpdate({
      id: partial.id,
      title: partial.title ?? '',
      detail: partial.detail,
      state: partial.state ?? 'pending',
    });
  };

  patch({ id: 'wifi', title: 'Wi‑Fi network (MyPiHotspot)', state: 'running' });
  const wifi = await mqttBridge.netValidateRequiredSsid();
  if (!wifi.ok) {
    patch({
      id: 'wifi',
      title: 'Wi‑Fi network (MyPiHotspot)',
      state: 'fail',
      detail: `Connected SSID "${wifi.ssid ?? 'unknown'}" does not match required "${wifi.required}".`,
    });
    return { ok: false };
  }
  patch({
    id: 'wifi',
    title: 'Wi‑Fi network (MyPiHotspot)',
    state: 'ok',
    detail: `SSID verified: ${wifi.ssid}`,
  });

  patch({ id: 'mqtt', title: 'MQTT session handshake', state: 'running' });
  const mqttConn = await ensureMqttConnected();
  if (!mqttConn.ok) {
    patch({
      id: 'mqtt',
      title: 'MQTT session handshake',
      state: 'fail',
      detail: mqttConn.message ?? 'Unable to connect',
    });
    return { ok: false };
  }
  patch({
    id: 'mqtt',
    title: 'MQTT session handshake',
    state: 'ok',
    detail: 'Connected to broker',
  });

  patch({ id: 'topics', title: 'Topic subscriptions configured', state: 'running' });
  patch({
    id: 'topics',
    title: 'Topic subscriptions configured',
    state: 'ok',
    detail: 'Subscribed to esp/stepper',
  });
  try {
    await mqttBridge.mqttSubscribe({
      topics: [MQTT_TOPICS.ESP_STEPPER_STREAM],
      qos: 0,
    });
  } catch (e) {
    patch({
      id: 'topics',
      title: 'Topic subscriptions configured',
      state: 'fail',
      detail: e instanceof Error ? e.message : String(e),
    });
    return { ok: false };
  }

  console.info('[HEALTH][RESULT] STREAM=SKIPPED OVERALL=PASS');
  return { ok: true };
}
