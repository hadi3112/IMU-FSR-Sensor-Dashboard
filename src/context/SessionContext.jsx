import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ALL_SUBSCRIBABLE_TOPICS } from '../lib/mqttTopics.js';
import * as mqttBridge from '../services/mqttBridge.js';

/** @typedef {'devices'|'stats'|'profile'} AppTab */

/** @typedef {'disconnected'|'connecting'|'connected'|'subscribed'|'waiting'|'validation_pending'} TopicWireState */

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [activeTab, setActiveTab] = useState(/** @type {AppTab} */ ('devices'));
  const [sessionId, setSessionId] = useState('bootstrapping');
  const [diagnosticsPassed, setDiagnosticsPassed] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  const [mqttConnected, setMqttConnected] = useState(false);
  const [mqttHost, setMqttHost] = useState('10.42.0.1');
  const [mqttPort, setMqttPort] = useState(1883);
  const [mqttReconnect, setMqttReconnect] = useState(true);
  const [mqttClientId, setMqttClientId] = useState('stryder-desktop');

  const [selectedTopics, setSelectedTopics] = useState(/** @type {string[]} */ ([]));
  const [topicStates, setTopicStates] = useState(/** @type {Record<string, TopicWireState>} */ ({}));

  const setTopicState = useCallback((topic, state) => {
    setTopicStates((prev) => ({ ...prev, [topic]: state }));
  }, []);

  const [rightAssist, setRightAssist] = useState(0);
  const [leftAssist, setLeftAssist] = useState(0);
  const [couplingRatio, setCouplingRatio] = useState(0.3);

  const [batteryPct] = useState(34);
  const [speedKmh] = useState(0);
  const [uptimeSec, setUptimeSec] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const boot = await mqttBridge.appGetSessionBootstrap();
      if (!cancelled) setSessionId(boot.sessionId);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const offStatus = mqttBridge.subscribeMqttStatus((s) => {
      setMqttConnected(Boolean(s.connected));
    });
    const offErr = mqttBridge.subscribeMqttError(() => {
      /* surfaced in MQTT panel */
    });
    void mqttBridge.mqttGetState().then((s) => setMqttConnected(Boolean(s.connected)));
    return () => {
      offStatus();
      offErr();
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setUptimeSec((u) => u + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setDiagnosticsPassed(false);
  }, [selectedTopics, mqttHost, mqttPort]);

  useEffect(() => {
    if (!mqttConnected) {
      ALL_SUBSCRIBABLE_TOPICS.forEach((t) => setTopicState(t, 'disconnected'));
    }
  }, [mqttConnected, setTopicState]);

  const connectMqtt = useCallback(async () => {
    const res = await mqttBridge.mqttConnect({
      host: mqttHost,
      port: Number(mqttPort),
      clientId: mqttClientId,
      reconnectPeriod: mqttReconnect ? 1500 : 0,
      keepalive: 60,
    });
    return res;
  }, [mqttClientId, mqttHost, mqttPort, mqttReconnect]);

  const disconnectMqtt = useCallback(async () => {
    await mqttBridge.mqttDisconnect();
    setMqttConnected(false);
    ALL_SUBSCRIBABLE_TOPICS.forEach((t) => setTopicState(t, 'disconnected'));
  }, [setTopicState]);

  const syncSubscriptions = useCallback(async () => {
    if (!mqttConnected) return;
    try {
      ALL_SUBSCRIBABLE_TOPICS.forEach((t) => {
        setTopicState(t, selectedTopics.includes(t) ? 'waiting' : 'disconnected');
      });
      await mqttBridge.mqttUnsubscribe({ topics: ALL_SUBSCRIBABLE_TOPICS });
      if (selectedTopics.length) {
        await mqttBridge.mqttSubscribe({ topics: selectedTopics, qos: 0 });
        selectedTopics.forEach((t) => setTopicState(t, 'subscribed'));
      }
    } catch {
      selectedTopics.forEach((t) => setTopicState(t, 'disconnected'));
    }
  }, [mqttConnected, selectedTopics, setTopicState]);

  useEffect(() => {
    void syncSubscriptions();
  }, [syncSubscriptions]);

  const toggleTopic = useCallback((topic, on) => {
    setSelectedTopics((prev) => {
      if (on) return prev.includes(topic) ? prev : [...prev, topic];
      return prev.filter((t) => t !== topic);
    });
  }, []);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      sessionId,
      diagnosticsPassed,
      setDiagnosticsPassed,
      sessionActive,
      setSessionActive,

      mqttConnected,
      mqttHost,
      setMqttHost,
      mqttPort,
      setMqttPort,
      mqttReconnect,
      setMqttReconnect,
      mqttClientId,
      setMqttClientId,
      connectMqtt,
      disconnectMqtt,

      selectedTopics,
      toggleTopic,
      topicStates,
      setTopicState,

      rightAssist,
      setRightAssist,
      leftAssist,
      setLeftAssist,
      couplingRatio,
      setCouplingRatio,

      batteryPct,
      speedKmh,
      uptimeSec,
    }),
    [
      activeTab,
      batteryPct,
      connectMqtt,
      couplingRatio,
      diagnosticsPassed,
      disconnectMqtt,
      leftAssist,
      mqttClientId,
      mqttConnected,
      mqttHost,
      mqttPort,
      mqttReconnect,
      rightAssist,
      selectedTopics,
      sessionActive,
      sessionId,
      setTopicState,
      speedKmh,
      toggleTopic,
      topicStates,
      uptimeSec,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}
