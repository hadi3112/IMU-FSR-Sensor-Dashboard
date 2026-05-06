import { useEffect, useRef } from 'react';
import { useSession } from '../../context/SessionContext.jsx';
import { usePayloadLog } from '../../context/PayloadLogContext.jsx';
import { CommandStreamController } from '../../services/commandStreamController.js';

/** Keeps MQTT motor stream alive whenever broker + stepper topics allow. */
export function CommandStreamBridge() {
  const { mqttConnected, rightAssist, leftAssist } = useSession();
  const { append } = usePayloadLog();

  const latest = useRef({ right: rightAssist, left: leftAssist });
  latest.current.right = rightAssist;
  latest.current.left = leftAssist;

  useEffect(() => {
    const controller = new CommandStreamController({
      intervalMs: 20,
      getRightAssist: () => latest.current.right,
      getLeftAssist: () => latest.current.left,
      onPublish: (topic, payload) => append(topic, payload),
    });
    if (mqttConnected) controller.start();
    return () => controller.stop();
  }, [append, mqttConnected]);

  return null;
}
