/** Canonical MQTT topic for single-stream stepper control. */
export const MQTT_TOPICS = {
  ESP_STEPPER_STREAM: 'esp/stepper',
};

/** Renderer uses a single stream for publish/observe workflows. */
export const ALL_SUBSCRIBABLE_TOPICS = [MQTT_TOPICS.ESP_STEPPER_STREAM];

export const STEPPER_COMMAND_TOPICS = [MQTT_TOPICS.ESP_STEPPER_STREAM];
export const STEPPER_STATE_TOPICS = [MQTT_TOPICS.ESP_STEPPER_STREAM];
