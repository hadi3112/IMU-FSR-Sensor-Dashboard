/**
 * Node-side MQTT transport. All broker I/O stays in the main process.
 * Renderer talks only via IPC (preload bridge).
 */
import mqtt from 'mqtt';

/** @type {import('mqtt').MqttClient | null} */
let client = null;

/** @type {import('mqtt').IClientOptions | null} */
let lastOptions = null;

/**
 * @param {{ host: string; port: number; protocol?: 'mqtt'|'mqtts'; clientId?: string; username?: string; password?: string; reconnectPeriod?: number; keepalive?: number; clean?: boolean }} opts
 * @param {{ onConnect?: () => void; onReconnect?: () => void; onClose?: () => void; onError?: (err: Error) => void; onMessage?: (topic: string, payload: Buffer) => void }} events
 */
export function mqttConnect(opts, events = {}) {
  mqttDisconnect();
  const protocol = opts.protocol ?? 'mqtt';
  const url = `${protocol}://${opts.host}:${opts.port}`;
  lastOptions = { ...opts };

  client = mqtt.connect(url, {
    clientId: opts.clientId,
    username: opts.username,
    password: opts.password,
    reconnectPeriod: opts.reconnectPeriod ?? 1000,
    keepalive: opts.keepalive ?? 60,
    clean: opts.clean ?? true,
    // TODO: TLS ca/cert paths for mqtts in production deployments
  });

  client.on('connect', () => events.onConnect?.());
  client.on('reconnect', () => events.onReconnect?.());
  client.on('close', () => events.onClose?.());
  client.on('error', (err) => events.onError?.(err));
  client.on('message', (topic, payload) => events.onMessage?.(topic, payload));
}

export function mqttDisconnect() {
  if (client) {
    const c = client;
    client = null;
    try {
      c.removeAllListeners();
      // Guard against late async broker errors (e.g. connack timeout) after forced end.
      c.on('error', () => {});
      c.end(true);
    } catch {
      /* ignore */
    }
  }
}

export function mqttIsConnected() {
  return Boolean(client?.connected);
}

export function mqttPublish(topic, payload, publishOpts = {}) {
  if (!client?.connected) {
    throw new Error('MQTT client is not connected');
  }
  const body =
    typeof payload === 'string' || Buffer.isBuffer(payload)
      ? payload
      : JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    client.publish(topic, body, publishOpts, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * @param {string[]} topics
 * @param {import('mqtt').IClientSubscribeOptions | import('mqtt').IClientSubscribeProperties} [subOpts]
 */
export function mqttSubscribe(topics, subOpts = { qos: 0 }) {
  if (!client?.connected) {
    throw new Error('MQTT client is not connected');
  }
  if (!topics.length) {
    return Promise.resolve([]);
  }
  return new Promise((resolve, reject) => {
    client.subscribe(topics, subOpts, (err, granted) => {
      if (err) reject(err);
      else resolve(granted ?? []);
    });
  });
}

/**
 * @param {string[]} topics
 */
export function mqttUnsubscribe(topics) {
  if (!client?.connected) {
    return Promise.resolve();
  }
  if (!topics.length) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    client.unsubscribe(topics, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function mqttLastOptions() {
  return lastOptions;
}
