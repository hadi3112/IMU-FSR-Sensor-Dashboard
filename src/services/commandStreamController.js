import { MQTT_TOPICS } from '../lib/mqttTopics.js';
import {
  computeMotorTargetsFromMotion,
  DEFAULT_TRANSLATION_CONFIG,
  percentToNemaStepCounts,
} from './assistTranslation.js';
import * as mqttBridge from './mqttBridge.js';

/**
 * High-frequency command streaming. Publishes raw assist (no extra smoothing) plus NEMA microstep counts (0–200).
 */

export class CommandStreamController {
  /**
   * @param {{
   *  intervalMs?: number;
   *  streamWhileStable?: boolean;
   *  getSessionId: () => string;
   *  getRightAssist: () => number;
   *  getLeftAssist: () => number;
   *  getSelectedTopics: () => string[];
   *  getTranslationConfig?: () => typeof DEFAULT_TRANSLATION_CONFIG;
   * }} opts
   */
  constructor(opts) {
    this.intervalMs = opts.intervalMs ?? 40;
    this.streamWhileStable = opts.streamWhileStable ?? true;
    this.getSessionId = opts.getSessionId;
    this.getRightAssist = opts.getRightAssist;
    this.getLeftAssist = opts.getLeftAssist;
    this.getSelectedTopics = opts.getSelectedTopics;
    this.getTranslationConfig = opts.getTranslationConfig ?? (() => DEFAULT_TRANSLATION_CONFIG);

    /** @type {ReturnType<typeof setInterval> | null} */
    this.timer = null;
    this.sequence = 0;
    this.lastTick = performance.now();
    this.prevR = 0;
    this.prevL = 0;
  }

  start() {
    if (this.timer) return;
    const tick = async () => {
      const now = performance.now();
      const dtMs = now - this.lastTick;
      this.lastTick = now;

      const cfg = this.getTranslationConfig();
      const rawR = this.getRightAssist();
      const rawL = this.getLeftAssist();

      const topics = new Set(this.getSelectedTopics());
      const sessionId = this.getSessionId();

      const buildPayload = (leg, pct, pctPrev) => {
        const { stepIncrement, speedTarget, rate } = computeMotorTargetsFromMotion({
          percent: pct,
          percentPrev: pctPrev,
          dtMs,
          config: cfg,
        });
        const nema = percentToNemaStepCounts(pct);
        this.sequence = (this.sequence + 1) & 0xffff_ffff;
        return {
          leg,
          targetAssistPercent: pct,
          barsLit: nema.barsLit,
          targetMicrostepCounts: nema.targetMicrostepCounts,
          nemaStepCounts: nema.targetMicrostepCounts,
          stepIncrement,
          speedTarget,
          uiRate: rate,
          timestamp: Date.now(),
          sequence: this.sequence,
          sessionId,
          modeFlags: ['assist_stream_v2'],
        };
      };

      const publishIfSelected = async (topic, leg, pct, pctPrev) => {
        if (!topics.has(topic)) return;
        try {
          await mqttBridge.mqttPublish({
            topic,
            payload: buildPayload(leg, pct, pctPrev),
            qos: 0,
            retain: false,
          });
        } catch {
          /* mqtt:error IPC */
        }
      };

      const moved =
        Math.abs(rawR - this.prevR) > 0.001 ||
        Math.abs(rawL - this.prevL) > 0.001;

      if (!this.streamWhileStable && !moved) {
        return;
      }

      await publishIfSelected(MQTT_TOPICS.STEPPER_RIGHT, 'right', rawR, this.prevR);
      await publishIfSelected(MQTT_TOPICS.STEPPER_LEFT, 'left', rawL, this.prevL);

      this.prevR = rawR;
      this.prevL = rawL;
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
