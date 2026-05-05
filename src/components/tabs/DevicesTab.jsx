import { useEffect, useRef } from 'react';
import { useSession } from '../../context/SessionContext.jsx';
import { MQTT_TOPICS } from '../../lib/mqttTopics.js';
import { CommandStreamController } from '../../services/commandStreamController.js';
import { DualLegAssistPanel } from '../controls/DualLegAssistPanel.jsx';

export function DevicesTab() {
  const {
    sessionId,
    mqttConnected,
    selectedTopics,
    rightAssist,
    leftAssist,
  } = useSession();

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
    });
    if (mqttConnected && wantsSteppers) controller.start();
    return () => controller.stop();
  }, [mqttConnected, selectedTopics, sessionId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DualLegAssistPanel />
    </div>
  );
}
