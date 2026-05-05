/**
 * Bilateral assist coupling: moving one leg applies an opposite reduction on the other.
 * couplingRatio 0.3 means the opposite leg drops by 30% of the driving leg's applied delta.
 */

export function clampPct(v) {
  return Math.min(100, Math.max(0, Number.isFinite(v) ? v : 0));
}

/**
 * @param {{ sourceLeg: 'right' | 'left'; right: number; left: number; delta: number; couplingRatio: number }} p
 */
export function applyCoupledDelta({ sourceLeg, right, left, delta, couplingRatio }) {
  const r = Math.min(1, Math.max(0, couplingRatio));
  if (sourceLeg === 'right') {
    const newR = clampPct(right + delta);
    const applied = newR - right;
    const newL = clampPct(left - r * applied);
    return { right: newR, left: newL, appliedDelta: applied };
  }
  const newL = clampPct(left + delta);
  const applied = newL - left;
  const newR = clampPct(right - r * applied);
  return { right: newR, left: newL, appliedDelta: applied };
}
