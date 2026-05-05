import { buildHealthCheckRequest, parseHealthAck } from '../lib/healthProtocol.js';
import * as mqttBridge from './mqttBridge.js';

/**
 * @typedef {{ id: string; title: string; detail?: string; state: 'pending'|'running'|'ok'|'fail' }} DiagnosticRow
 */

/**
 * @param {{
 *  broker: { host: string; port: number };
 *  selectedTopics: string[];
 *  ensureMqttConnected: () => Promise<{ ok: boolean; message?: string }>;
 *  healthTimeoutMs?: number;
 *  onRowUpdate: (row: DiagnosticRow) => void;
 * }} args
 */
export async function runDiagnosticsPipeline(args) {
  const { broker, selectedTopics, ensureMqttConnected, healthTimeoutMs = 6000, onRowUpdate } = args;

  /** @type {(partial: Partial<DiagnosticRow> & { id: string }) => void} */
  const patch = (partial) => {
    onRowUpdate({
      id: partial.id,
      title: partial.title ?? '',
      detail: partial.detail,
      state: partial.state ?? 'pending',
    });
  };

  patch({ id: 'wifi', title: 'Wi‑Fi network (Galaxy_A12)', state: 'running' });
  const wifi = await mqttBridge.netValidateRequiredSsid();
  if (!wifi.ok) {
    patch({
      id: 'wifi',
      title: 'Wi‑Fi network (Galaxy_A12)',
      state: 'fail',
      detail: `Connected SSID "${wifi.ssid ?? 'unknown'}" does not match required "${wifi.required}".`,
    });
    return { ok: false };
  }
  patch({
    id: 'wifi',
    title: 'Wi‑Fi network (Galaxy_A12)',
    state: 'ok',
    detail: `SSID verified: ${wifi.ssid}`,
  });

  patch({ id: 'tcp', title: 'Broker reachability (TCP)', state: 'running' });
  const tcp = await mqttBridge.netTestTcp({ host: broker.host, port: broker.port, timeoutMs: 4000 });
  if (!tcp.ok) {
    patch({
      id: 'tcp',
      title: 'Broker reachability (TCP)',
      state: 'fail',
      detail: `Cannot reach ${broker.host}:${broker.port} (${tcp.error ?? 'error'})`,
    });
    return { ok: false };
  }
  patch({
    id: 'tcp',
    title: 'Broker reachability (TCP)',
    state: 'ok',
    detail: `Socket OK (~${tcp.latencyMs ?? '?'} ms)`,
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
  if (!selectedTopics.length) {
    patch({
      id: 'topics',
      title: 'Topic subscriptions configured',
      state: 'fail',
      detail: 'Select at least one MQTT topic in the panel before validation.',
    });
    return { ok: false };
  }
  patch({
    id: 'topics',
    title: 'Topic subscriptions configured',
    state: 'ok',
    detail: `${selectedTopics.length} topic(s) selected`,
  });

  /**
   * @param {string} topic
   * @param {string} requestId
   * @param {number} ms
   */
  const waitForHealthAck = (topic, requestId, ms) =>
    new Promise((resolve) => {
      let settled = false;
      const unsubscribe = mqttBridge.subscribeMqttMessage((msg) => {
        if (settled || msg.topic !== topic) return;
        let parsed;
        try {
          parsed = JSON.parse(msg.payload);
        } catch {
          return;
        }
        if (!parsed || typeof parsed !== 'object') return;
        if (/** @type {any} */ (parsed).requestId !== requestId) return;
        settled = true;
        clearTimeout(timer);
        unsubscribe();
        resolve(parseHealthAck(parsed, topic, requestId));
      });
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        unsubscribe();
        resolve({ ok: false, reason: 'timeout' });
      }, ms);
    });

  try {
    for (const topic of selectedTopics) {
      const rowId = `health:${topic}`;
      patch({ id: rowId, title: `Device health: ${topic}`, state: 'running' });
      const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const payload = buildHealthCheckRequest(requestId, topic);

      try {
        await mqttBridge.mqttPublish({ topic, payload, qos: 0, retain: false });
      } catch (e) {
        patch({
          id: rowId,
          title: `Device health: ${topic}`,
          state: 'fail',
          detail: e instanceof Error ? e.message : String(e),
        });
        return { ok: false };
      }

      const result = await waitForHealthAck(topic, requestId, healthTimeoutMs);
      if (!result.ok) {
        patch({
          id: rowId,
          title: `Device health: ${topic}`,
          state: 'fail',
          detail: result.reason === 'timeout' ? 'Timed out waiting for health payload' : result.reason,
        });
        return { ok: false };
      }
      patch({
        id: rowId,
        title: `Device health: ${topic}`,
        state: 'ok',
        detail: 'Health payload verified',
      });
    }
  } finally {
    /* listeners unregister on completion */
  }

  return { ok: true };
}
