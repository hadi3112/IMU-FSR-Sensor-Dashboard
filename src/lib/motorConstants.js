/** Discrete power-rail segments per leg in the UI (NEMA count scaling uses this). */
export const POWER_BAR_SEGMENTS = 50;
/** Total microstep budget when all segments lit (50 × 4 = 200). */
export const MICROSTEPS_TOTAL = 200;
export const MICROSTEPS_PER_BAR = MICROSTEPS_TOTAL / POWER_BAR_SEGMENTS;

/** Shared absolute model with ESP firmware (0..199 => 0..358.2 deg). */
export const STEPPER_STEPS_PER_REV = 200;
export const STEPPER_ABSOLUTE_MIN = 0;
export const STEPPER_ABSOLUTE_MAX = 199;
