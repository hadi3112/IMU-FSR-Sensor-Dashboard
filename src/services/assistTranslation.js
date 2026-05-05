/**
 * UI assist % → motor command translation (skeleton + calibration hooks).
 * NEMA-style stepping: 100 UI bars × 2 microsteps each → 0..200 `targetMicrostepCounts` for firmware pacing.
 * TODO: Replace velocity scaling with calibrated constants from bench testing.
 */

export const DEFAULT_TRANSLATION_CONFIG = {
  percentToStepsBase: 1.8,
  velocityToStepsGain: 420,
  velocityToSpeedGain: 620,
  minStepIncrement: 0,
  maxStepIncrement: 4095,
  minSpeed: 0,
  maxSpeed: 3200,
  smoothing: 0.05,
  accelClamp: 900,
  decelClamp: 1400,
};

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Map 0–100% assist to discrete bar fill (0–100) and NEMA-aligned microstep budget (0–200).
 * @param {number} percent0to100
 */
export function percentToNemaStepCounts(percent0to100) {
  const p = clamp(percent0to100, 0, 100);
  const barsLit = Math.min(100, Math.max(0, Math.round((p / 100) * 100)));
  const targetMicrostepCounts = barsLit * 2;
  return { barsLit, targetMicrostepCounts };
}

/**
 * @param {{ percent: number; percentPrev: number; dtMs: number; config?: typeof DEFAULT_TRANSLATION_CONFIG }} args
 */
export function computeMotorTargetsFromMotion({ percent, percentPrev, dtMs, config = DEFAULT_TRANSLATION_CONFIG }) {
  const dt = Math.max(dtMs, 1e-3);
  const rate = Math.abs(percent - percentPrev) / dt;
  const stepIncrement = clamp(
    config.percentToStepsBase * percent + rate * config.velocityToStepsGain,
    config.minStepIncrement,
    config.maxStepIncrement,
  );
  const speedTarget = clamp(rate * config.velocityToSpeedGain, config.minSpeed, config.maxSpeed);
  return { stepIncrement, speedTarget, rate };
}

export function smoothToward(current, target, alpha) {
  return current + (target - current) * alpha;
}
