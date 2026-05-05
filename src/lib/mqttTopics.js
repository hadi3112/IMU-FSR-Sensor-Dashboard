/** Canonical MQTT topics for lower-limb ESP stack (UI + transport). */
export const MQTT_TOPICS = {
  SSR: 'ESP/SSR',
  IMUS: 'ESP/IMUS',
  STEPPER_RIGHT: 'ESP/stepper_right',
  STEPPER_LEFT: 'ESP/stepper_left',
};

export const ALL_SUBSCRIBABLE_TOPICS = [
  MQTT_TOPICS.SSR,
  MQTT_TOPICS.IMUS,
  MQTT_TOPICS.STEPPER_RIGHT,
  MQTT_TOPICS.STEPPER_LEFT,
];

export const STEPPER_TOPICS = [MQTT_TOPICS.STEPPER_RIGHT, MQTT_TOPICS.STEPPER_LEFT];
