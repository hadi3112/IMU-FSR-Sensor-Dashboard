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
  const { ensureMqttConnected, healthTimeoutMs = 6000, onRowUpdate } = args;

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
    detail: 'Subscribed to stepper/right/state + stepper/left/state',
  });
  try {
    await mqttBridge.mqttSubscribe({
      topics: [MQTT_TOPICS.STEPPER_RIGHT_STATE, MQTT_TOPICS.STEPPER_LEFT_STATE],
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

  /**
   * @param {string} topic
   * @param {number} ms
   */
  const waitForStateStream = (topic, ms) =>
    new Promise((resolve) => {
      let settled = false;
      let packetCount = 0;
      let lastArrival = 0;
      const unsubscribe = mqttBridge.subscribeMqttMessage((msg) => {
        if (settled || msg.topic !== topic) return;
        let parsed;
        try {
          parsed = JSON.parse(msg.payload);
        } catch {
          return;
        }
        if (!parsed || typeof parsed !== 'object') return;
        const p = /** @type {Record<string, unknown>} */ (parsed);
        const valid =
          Number.isFinite(Number(p.t)) &&
          Number.isFinite(Number(p.cp)) &&
          Number.isFinite(Number(p.tp)) &&
          (p.d === 0 || p.d === 1) &&
          (p.sp === 0 || p.sp === 1) &&
          (p.m === 0 || p.m === 1) &&
          (p.ok === 0 || p.ok === 1 || p.ok === true || p.ok === false);
        if (!valid) return;

        const now = Date.now();
        if (lastArrival !== 0 && now - lastArrival > 200) {
          packetCount = 0;
        }
        lastArrival = now;
        packetCount += 1;

        if (packetCount >= 3) {
          settled = true;
          clearTimeout(timer);
          unsubscribe();
          resolve({ ok: true });
        }
      });
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        unsubscribe();
        resolve({ ok: false, reason: 'Timed out waiting for continuous state packets' });
      }, ms);
    });

  const rightTopic = MQTT_TOPICS.STEPPER_RIGHT_STATE;
  const leftTopic = MQTT_TOPICS.STEPPER_LEFT_STATE;
  patch({ id: `health:${rightTopic}`, title: `Device health: ${rightTopic}`, state: 'running' });
  patch({ id: `health:${leftTopic}`, title: `Device health: ${leftTopic}`, state: 'running' });

  const [rightRes, leftRes] = await Promise.all([
    waitForStateStream(rightTopic, healthTimeoutMs),
    waitForStateStream(leftTopic, healthTimeoutMs),
  ]);

  patch({
    id: `health:${rightTopic}`,
    title: `Device health: ${rightTopic}`,
    state: rightRes.ok ? 'ok' : 'fail',
    detail: rightRes.ok ? 'Continuous state packets verified' : rightRes.reason,
  });
  patch({
    id: `health:${leftTopic}`,
    title: `Device health: ${leftTopic}`,
    state: leftRes.ok ? 'ok' : 'fail',
    detail: leftRes.ok ? 'Continuous state packets verified' : leftRes.reason,
  });

  return { ok: rightRes.ok || leftRes.ok };
}
