import { MQTT_TOPICS } from '../lib/mqttTopics.js';
import { percentToAbsolutePosition } from './assistTranslation.js';
import * as mqttBridge from './mqttBridge.js';

export class CommandStreamController {
  /**
   * @param {{
   *  intervalMs?: number;
   *  getRightAssist: () => number;
   *  getLeftAssist: () => number;
   *  onPublish?: (topic: string, payload: Record<string, unknown>) => void;
   * }} opts
   */
  constructor(opts) {
    this.intervalMs = opts.intervalMs ?? 20;
    this.getRightAssist = opts.getRightAssist;
    this.getLeftAssist = opts.getLeftAssist;
    this.onPublish = opts.onPublish;

    /** @type {ReturnType<typeof setInterval> | null} */
    this.timer = null;
    this.sequence = 0;
    this.prevRightPos = null;
    this.prevLeftPos = null;
  }

  start() {
    if (this.timer) return;
    const tick = async () => {
      const buildPayload = (targetPos, prevPos) => {
        this.sequence = (this.sequence + 1) >>> 0;
        const delta = prevPos == null ? 0 : Math.abs(targetPos - prevPos);
        return {
          t: this.sequence,
          p: targetPos,
          s: delta > 0 ? 1 : 0,
        };
      };
      const publish = async (topic, payload) => {
        try {
          await mqttBridge.mqttPublish({
            topic,
            payload,
            qos: 0,
            retain: false,
          });
          this.onPublish?.(topic, payload);
        } catch {
          /* mqtt:error IPC */
        }
      };

      const rightPos = percentToAbsolutePosition(this.getRightAssist());
      const leftPos = percentToAbsolutePosition(this.getLeftAssist());
      const rightPayload = buildPayload(rightPos, this.prevRightPos);
      const leftPayload = buildPayload(leftPos, this.prevLeftPos);

      await publish(MQTT_TOPICS.STEPPER_RIGHT_CMD, rightPayload);
      await publish(MQTT_TOPICS.STEPPER_LEFT_CMD, leftPayload);

      this.prevRightPos = rightPos;
      this.prevLeftPos = leftPos;
    };

    this.timer = setInterval(() => {
      void tick();
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
