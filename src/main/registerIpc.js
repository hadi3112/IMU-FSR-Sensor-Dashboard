import { ipcMain, app } from 'electron';
import {
  mqttConnect,
  mqttDisconnect,
  mqttIsConnected,
  mqttPublish,
  mqttSubscribe,
  mqttUnsubscribe,
  mqttLastOptions,
} from './mqttTransport.js';
import { REQUIRED_SSID, getCurrentWifiSsid, isRequiredSsid, testTcpReachable } from './networkDiagnostics.js';

/** @type {() => import('electron').BrowserWindow | null | undefined} */
let getMainWindow = () => null;

function sendToRenderer(channel, payload) {
  const win = getMainWindow?.();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload);
  }
}

export function registerIpcHandlers(mainWindowGetter) {
  getMainWindow = mainWindowGetter;

  ipcMain.handle('app:getSessionBootstrap', async () => ({
    sessionId: `${app.getName()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    // TODO: persist device serials / firmware from secure storage once hardware registry exists
  }));

  ipcMain.handle('net:getWifiSsid', async () => getCurrentWifiSsid());

  ipcMain.handle('net:validateRequiredSsid', async () => {
    const { ssid, platform, raw } = await getCurrentWifiSsid();
    return {
      ok: isRequiredSsid(ssid),
      ssid,
      required: REQUIRED_SSID,
      platform,
      detail: raw?.slice?.(0, 2000),
    };
  });

  ipcMain.handle('net:testTcp', async (_e, opts) => testTcpReachable(opts));

  ipcMain.handle('mqtt:connect', async (_e, opts) => {
    if (mqttIsConnected()) {
      return { ok: true, already: true };
    }
    return new Promise((resolve) => {
      let settled = false;
      let firstErrorMessage = null;
      const timer = setTimeout(() => {
        if (settled) return;
        mqttDisconnect();
        finish({
          ok: false,
          message:
            firstErrorMessage ??
            `MQTT connection timed out to ${opts.host}:${opts.port} (check hotspot and broker listener).`,
        });
      }, 15000);

      const finish = (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      };

      mqttConnect(opts, {
        onConnect: () => {
          sendToRenderer('mqtt:status', { connected: true, host: opts.host, port: opts.port });
          finish({ ok: true });
        },
        onReconnect: () => {
          sendToRenderer('mqtt:status', { connected: mqttIsConnected(), reconnecting: true });
        },
        onClose: () => {
          sendToRenderer('mqtt:status', { connected: false, closed: true });
        },
        onError: (err) => {
          firstErrorMessage = firstErrorMessage ?? err.message;
          sendToRenderer('mqtt:error', { message: err.message });
          if (!mqttIsConnected()) {
            mqttDisconnect();
            finish({
              ok: false,
              message: `MQTT connect failed for ${opts.host}:${opts.port} - ${err.message}`,
            });
          }
        },
        onMessage: (topic, payload) => {
          sendToRenderer('mqtt:message', {
            topic,
            payload: payload.toString('utf8'),
          });
        },
      });
    });
  });

  ipcMain.handle('mqtt:disconnect', async () => {
    mqttDisconnect();
    sendToRenderer('mqtt:status', { connected: false, disconnected: true });
    return { ok: true };
  });

  ipcMain.handle('mqtt:getState', async () => ({
    connected: mqttIsConnected(),
    last: mqttLastOptions(),
  }));

  ipcMain.handle('mqtt:subscribe', async (_e, { topics, qos }) => {
    const granted = await mqttSubscribe(topics, { qos: qos ?? 0 });
    return { ok: true, granted };
  });

  ipcMain.handle('mqtt:unsubscribe', async (_e, { topics }) => {
    await mqttUnsubscribe(topics);
    return { ok: true };
  });

  ipcMain.handle('mqtt:publish', async (_e, { topic, payload, qos, retain }) => {
    await mqttPublish(topic, payload, { qos: qos ?? 0, retain: Boolean(retain) });
    return { ok: true };
  });
}
