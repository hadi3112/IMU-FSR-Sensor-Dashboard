/** Canonical MQTT topics for bilateral stepper control stack. */
export const MQTT_TOPICS = {
  STEPPER_RIGHT_CMD: 'stepper/right/cmd',
  STEPPER_RIGHT_STATE: 'stepper/right/state',
  STEPPER_LEFT_CMD: 'stepper/left/cmd',
  STEPPER_LEFT_STATE: 'stepper/left/state',
};

/** Renderer subscribes only to state streams; cmd streams are publish-only. */
export const ALL_SUBSCRIBABLE_TOPICS = [MQTT_TOPICS.STEPPER_RIGHT_STATE, MQTT_TOPICS.STEPPER_LEFT_STATE];

export const STEPPER_COMMAND_TOPICS = [MQTT_TOPICS.STEPPER_RIGHT_CMD, MQTT_TOPICS.STEPPER_LEFT_CMD];
export const STEPPER_STATE_TOPICS = [MQTT_TOPICS.STEPPER_RIGHT_STATE, MQTT_TOPICS.STEPPER_LEFT_STATE];
