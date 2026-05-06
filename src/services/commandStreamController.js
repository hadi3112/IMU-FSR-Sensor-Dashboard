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
      const buildDirection = (targetPos, prevPos) => {
        if (prevPos == null) return 0;
        if (targetPos > prevPos) return 1;
        if (targetPos < prevPos) return -1;
        return 0;
      };
      const buildPayload = (rightTargetPos, leftTargetPos, prevRightPos, prevLeftPos) => {
        this.sequence = (this.sequence + 1) >>> 0;
        return {
          TR: rightTargetPos,
          TL: leftTargetPos,
          CR: prevRightPos ?? 0,
          CL: prevLeftPos ?? 0,
          DR: buildDirection(rightTargetPos, prevRightPos),
          DL: buildDirection(leftTargetPos, prevLeftPos),
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
      const payload = buildPayload(rightPos, leftPos, this.prevRightPos, this.prevLeftPos);

      await publish(MQTT_TOPICS.ESP_STEPPER_STREAM, payload);

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
