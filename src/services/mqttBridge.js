/**
 * Renderer-side façade over the secure preload `window.stryder` bridge.
 */

function getApi() {
  if (typeof window === 'undefined') return null;
  return window.stryder ?? null;
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
  return api.onMqttMessage(handler);
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
