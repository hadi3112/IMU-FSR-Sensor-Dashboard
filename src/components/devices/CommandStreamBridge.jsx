import { useEffect, useRef } from 'react';
import { useSession } from '../../context/SessionContext.jsx';
import { usePayloadLog } from '../../context/PayloadLogContext.jsx';
import { MQTT_TOPICS } from '../../lib/mqttTopics.js';
import { CommandStreamController } from '../../services/commandStreamController.js';

/** Keeps MQTT motor stream alive whenever broker + stepper topics allow. */
export function CommandStreamBridge() {
  const { sessionId, mqttConnected, selectedTopics, rightAssist, leftAssist } = useSession();
  const { append } = usePayloadLog();

  const latest = useRef({ right: rightAssist, left: leftAssist });
  latest.current.right = rightAssist;
  latest.current.left = leftAssist;

  useEffect(() => {
    const wantsSteppers =
      selectedTopics.includes(MQTT_TOPICS.STEPPER_RIGHT) || selectedTopics.includes(MQTT_TOPICS.STEPPER_LEFT);
    const controller = new CommandStreamController({
      intervalMs: 35,
      streamWhileStable: true,
      getSessionId: () => sessionId,
      getRightAssist: () => latest.current.right,
      getLeftAssist: () => latest.current.left,
      getSelectedTopics: () => selectedTopics,
      onPublish: (topic, payload) => append(topic, payload),
    });
    if (mqttConnected && wantsSteppers) controller.start();
    return () => controller.stop();
  }, [append, mqttConnected, selectedTopics, sessionId]);

  return null;
}
