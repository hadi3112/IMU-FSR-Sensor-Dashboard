/**
 * Renderer-side façade over the secure preload `window.stryder` bridge.
 */

function getApi() {
  if (typeof window === 'undefined') return null;
  return window.stryder ?? null;
}

function fmtNow() {
  return new Date().toISOString();
}

/**
 * @param {unknown} payload
 * @returns {string}
 */
function describePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return `raw=${typeof payload === 'string' ? payload : JSON.stringify(payload)}`;
  }
  const p = /** @type {Record<string, unknown>} */ (payload);
  const labels = [
    ['TR', 'TR'],
    ['TL', 'TL'],
    ['CR', 'CR'],
    ['CL', 'CL'],
    ['DR', 'DR'],
    ['DL', 'DL'],
    ['t', 'seq'],
    ['cp', 'currentPos'],
    ['tp', 'targetPos'],
    ['p', 'targetPosCmd'],
    ['d', 'dir'],
    ['sp', 'speedProfile'],
    ['s', 'speedModeCmd'],
    ['m', 'moving'],
    ['ok', 'healthOk'],
    ['leg', 'leg'],
    ['targetMicrostepCounts', 'targetMicrostepCounts'],
    ['targetAssistPercent', 'targetAssistPercent'],
  ];
  const parts = labels
    .filter(([k]) => Object.prototype.hasOwnProperty.call(p, k))
    .map(([k, label]) => `${label}(${k})=${String(p[k])}`);
  if (parts.length) return parts.join(' | ');
  return `keys=${Object.keys(p).join(',')}`;
}

export function isBridgeAvailable() {
  return Boolean(getApi());
}

export async function appGetSessionBootstrap() {
  const api = getApi();
  if (!api) return { sessionId: `offline-${Date.now().toString(36)}` };
  return api.appGetSessionBootstrap();
}

export async function mqttConnect(opts) {
  const api = getApi();
  if (!api) return { ok: false, message: 'Electron bridge unavailable' };
  return api.mqttConnect(opts);
}

export async function mqttDisconnect() {
  const api = getApi();
  if (!api) return { ok: false };
  return api.mqttDisconnect();
}

export async function mqttGetState() {
  const api = getApi();
  if (!api) return { connected: false };
  return api.mqttGetState();
}

export async function mqttSubscribe(payload) {
  const api = getApi();
  if (!api) throw new Error('Electron bridge unavailable');
  return api.mqttSubscribe(payload);
}

export async function mqttUnsubscribe(payload) {
  const api = getApi();
  if (!api) return { ok: false };
  return api.mqttUnsubscribe(payload);
}

export async function mqttPublish(payload) {
  const api = getApi();
  if (!api) throw new Error('Electron bridge unavailable');
  try {
    const topic = typeof payload?.topic === 'string' ? payload.topic : 'unknown-topic';
    const body = payload?.payload;
    if (topic === 'esp/stepper' && body && typeof body === 'object') {
      const p = /** @type {Record<string, unknown>} */ (body);
      console.info(
        `[DASH->ESP] esp/stepper TR=${String(p.TR)} TL=${String(p.TL)} CR=${String(p.CR)} CL=${String(p.CL)} DR=${String(p.DR)} DL=${String(p.DL)}`,
      );
    }
    console.info(`[MQTT][${fmtNow()}][DASH->ESP] topic=${topic} | ${describePayload(body)}`);
  } catch {
    /* best-effort debug logging */
  }
  return api.mqttPublish(payload);
}

export async function netValidateRequiredSsid() {
  const api = getApi();
  if (!api) return { ok: false, ssid: null, required: 'MyPiHotspot', platform: 'web', detail: 'No bridge' };
  return api.netValidateRequiredSsid();
}

export async function netTestTcp(opts) {
  const api = getApi();
  if (!api) return { ok: false, error: 'No bridge' };
  return api.netTestTcp(opts);
}

export function subscribeMqttMessage(handler) {
  const api = getApi();
  if (!api) return () => {};
  return api.onMqttMessage((msg) => {
    try {
      const parsed = JSON.parse(msg.payload);
      const isStepperStream = msg.topic === 'esp/stepper';
      if (isStepperStream) {
        const p = /** @type {Record<string, unknown>} */ (parsed);
        console.info(
          `[ESP->DASH] esp/stepper TR=${String(p.TR)} TL=${String(p.TL)} CR=${String(p.CR)} CL=${String(p.CL)} DR=${String(p.DR)} DL=${String(p.DL)}`,
        );
      }
      console.info(`[MQTT][${fmtNow()}][ESP->DASH] topic=${msg.topic} | ${describePayload(parsed)}`);
    } catch {
      console.info(`[MQTT][${fmtNow()}][ESP->DASH] topic=${msg.topic} | raw=${msg.payload}`);
    }
    handler(msg);
  });
}

export function subscribeMqttStatus(handler) {
  const api = getApi();
  if (!api) return () => {};
  return api.onMqttStatus(handler);
}

export function subscribeMqttError(handler) {
  const api = getApi();
  if (!api) return () => {};
  return api.onMqttError(handler);
}
