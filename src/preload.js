import { contextBridge, ipcRenderer } from 'electron';

const stryder = {
  appGetSessionBootstrap: () => ipcRenderer.invoke('app:getSessionBootstrap'),

  netGetWifiSsid: () => ipcRenderer.invoke('net:getWifiSsid'),
  netValidateRequiredSsid: () => ipcRenderer.invoke('net:validateRequiredSsid'),
  netTestTcp: (opts) => ipcRenderer.invoke('net:testTcp', opts),

  mqttConnect: (opts) => ipcRenderer.invoke('mqtt:connect', opts),
  mqttDisconnect: () => ipcRenderer.invoke('mqtt:disconnect'),
  mqttGetState: () => ipcRenderer.invoke('mqtt:getState'),
  mqttSubscribe: (payload) => ipcRenderer.invoke('mqtt:subscribe', payload),
  mqttUnsubscribe: (payload) => ipcRenderer.invoke('mqtt:unsubscribe', payload),
  mqttPublish: (payload) => ipcRenderer.invoke('mqtt:publish', payload),

  onMqttMessage: (handler) => {
    const listener = (_event, data) => handler(data);
    ipcRenderer.on('mqtt:message', listener);
    return () => ipcRenderer.removeListener('mqtt:message', listener);
  },
  onMqttStatus: (handler) => {
    const listener = (_event, data) => handler(data);
    ipcRenderer.on('mqtt:status', listener);
    return () => ipcRenderer.removeListener('mqtt:status', listener);
  },
  onMqttError: (handler) => {
    const listener = (_event, data) => handler(data);
    ipcRenderer.on('mqtt:error', listener);
    return () => ipcRenderer.removeListener('mqtt:error', listener);
  },
};

contextBridge.exposeInMainWorld('stryder', stryder);
