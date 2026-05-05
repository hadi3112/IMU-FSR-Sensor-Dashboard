/** Discrete power-rail segments per leg in the UI (NEMA count scaling uses this). */
export const POWER_BAR_SEGMENTS = 20;
/** Total microstep budget when all segments lit (20 × 10 = 200). */
export const MICROSTEPS_TOTAL = 200;
export const MICROSTEPS_PER_BAR = MICROSTEPS_TOTAL / POWER_BAR_SEGMENTS;
