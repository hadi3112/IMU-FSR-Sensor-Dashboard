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
   * @param {string} stateTopic
   * @param {number} ms
   */
  const waitForHealthyState = (stateTopic, ms) =>
    new Promise((resolve) => {
      let settled = false;
      let consecutiveOk = 0;
      /** @type {number[]} */
      let okBuffer = [];
      let lastArrival = 0;
      const CONTINUITY_GAP_MS = 2500;
      const REQUIRED_OK_CONSECUTIVE = 3;
      /** @type {ReturnType<typeof setTimeout> | null} */
      let inactivityTimer = null;
      const side = stateTopic.includes('/right/') ? 'RIGHT' : stateTopic.includes('/left/') ? 'LEFT' : stateTopic;
      const failNoPackets = () => {
        if (settled) return;
        settled = true;
        unsubscribe();
        resolve({ ok: false, reason: 'Timed out waiting for state packets' });
      };
      const restartInactivityTimer = () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(failNoPackets, ms);
      };
      restartInactivityTimer();
      const unsubscribe = mqttBridge.subscribeMqttMessage((msg) => {
        if (settled || msg.topic !== stateTopic) return;
        let parsed;
        try {
          parsed = JSON.parse(msg.payload);
        } catch {
          return;
        }
        if (!parsed || typeof parsed !== 'object') return;
        const p = /** @type {Record<string, unknown>} */ (parsed);
        const hasStateShape =
          Number.isFinite(Number(p.t)) &&
          Number.isFinite(Number(p.cp)) &&
          Number.isFinite(Number(p.tp)) &&
          (p.d === 0 || p.d === 1) &&
          (p.sp === 0 || p.sp === 1) &&
          (p.m === 0 || p.m === 1) &&
          (p.ok === 0 || p.ok === 1 || p.ok === true || p.ok === false);
        if (!hasStateShape) return;
        restartInactivityTimer();

        const healthy = p.ok === 1 || p.ok === true || Number(p.ok) === 1;

        const now = Date.now();
        const isStaleGap = lastArrival !== 0 && now - lastArrival > CONTINUITY_GAP_MS;
        if (isStaleGap) {
          consecutiveOk = 0;
          okBuffer = [];
        }
        lastArrival = now;

        if (healthy) {
          consecutiveOk += 1;
          okBuffer = [...okBuffer, 1].slice(-REQUIRED_OK_CONSECUTIVE);
        } else {
          consecutiveOk = 0;
          okBuffer = [...okBuffer, 0].slice(-REQUIRED_OK_CONSECUTIVE);
        }
        console.info(
          `[HEALTH][${side}] buffer=[${okBuffer.join(',')}] consecutiveOk=${consecutiveOk} t=${String(p.t)} ok=${String(p.ok)}`,
        );

        if (consecutiveOk >= REQUIRED_OK_CONSECUTIVE) {
          settled = true;
          if (inactivityTimer) clearTimeout(inactivityTimer);
          unsubscribe();
          resolve({ ok: true });
        }
      });
    });

  const rightTopic = MQTT_TOPICS.STEPPER_RIGHT_STATE;
  const leftTopic = MQTT_TOPICS.STEPPER_LEFT_STATE;
  patch({ id: `health:${rightTopic}`, title: `Device health: ${rightTopic}`, state: 'running' });
  patch({ id: `health:${leftTopic}`, title: `Device health: ${leftTopic}`, state: 'running' });

  const [rightRes, leftRes] = await Promise.all([
    waitForHealthyState(rightTopic, healthTimeoutMs),
    waitForHealthyState(leftTopic, healthTimeoutMs),
  ]);

  patch({
    id: `health:${rightTopic}`,
    title: `Device health: ${rightTopic}`,
    state: rightRes.ok ? 'ok' : 'fail',
    detail: rightRes.ok ? 'Healthy state verified (ok=1)' : rightRes.reason,
  });
  patch({
    id: `health:${leftTopic}`,
    title: `Device health: ${leftTopic}`,
    state: leftRes.ok ? 'ok' : 'fail',
    detail: leftRes.ok ? 'Healthy state verified (ok=1)' : leftRes.reason,
  });
  console.info(
    `[HEALTH][RESULT] RIGHT=${rightRes.ok ? 'PASS' : 'FAIL'} LEFT=${leftRes.ok ? 'PASS' : 'FAIL'} OVERALL=${rightRes.ok || leftRes.ok ? 'PASS' : 'FAIL'}`,
  );

  return { ok: rightRes.ok || leftRes.ok };
}
