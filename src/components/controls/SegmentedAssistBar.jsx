import { useMemo, useRef, useState } from 'react';
import { clampPct } from '../../services/assistCoupling.js';
import { percentToNemaStepCounts } from '../../services/assistTranslation.js';
import { POWER_BAR_SEGMENTS } from '../../lib/motorConstants.js';

function barsFromPercent(pct) {
  const v = clampPct(pct);
  return Math.min(POWER_BAR_SEGMENTS, Math.max(0, Math.round((v / 100) * POWER_BAR_SEGMENTS)));
}

function percentFromBars(bars) {
  return (bars / POWER_BAR_SEGMENTS) * 100;
}

/**
 * Horizontal strip: map pointer X across track to lit bar count (immediate, no transition lag).
 */
function barsFromClientX(trackEl, clientX) {
  const r = trackEl.getBoundingClientRect();
  const t = Math.min(1, Math.max(0, (clientX - r.left) / Math.max(1, r.width)));
  return Math.min(POWER_BAR_SEGMENTS, Math.max(0, Math.round(t * POWER_BAR_SEGMENTS)));
}

/**
 * @param {{
 *  label: string;
 *  value: number;
 *  sourceLeg: 'right' | 'left';
 *  onChange: (next: number) => void;
 * }} props
 */
export function SegmentedAssistBar({ label, value, sourceLeg, onChange }) {
  const trackRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const drag = useRef({ active: false, pointerId: 0 });
  const [dragging, setDragging] = useState(false);

  const barsLit = useMemo(() => barsFromPercent(value), [value]);
  const snappedPct = percentFromBars(barsLit);
  const counts = useMemo(() => percentToNemaStepCounts(snappedPct).targetMicrostepCounts, [snappedPct]);

  const emitFromEvent = (clientX) => {
    const el = trackRef.current;
    if (!el) {
      onChange(percentFromBars(barsFromPercent(value)));
      return;
    }
    const b = barsFromClientX(el, clientX);
    onChange(percentFromBars(b));
  };

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { active: true, pointerId: e.pointerId };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    emitFromEvent(e.clientX);
  };

  const onPointerMove = (e) => {
    if (!drag.current.active || e.pointerId !== drag.current.pointerId) return;
    emitFromEvent(e.clientX);
  };

  const onPointerUp = (e) => {
    if (e.pointerId !== drag.current.pointerId) return;
    drag.current.active = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const thumbLeft = `calc(${(barsLit / POWER_BAR_SEGMENTS) * 100}% - 1px)`;

  return (
    <div className="w-full shrink-0 rounded-lg border border-white/10 bg-gradient-to-b from-[#1a1c1e] to-[#121416] p-2 ring-1 ring-white/5">
      <div className="mb-1 flex items-end justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e8e93]">{label}</div>
        <div className="text-right">
          <div className="text-xl font-semibold tabular-nums text-[#34c759]">{counts}</div>
          <div className="text-[9px] font-medium text-[#6e6e73]">counts</div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative mx-auto h-24 w-full cursor-ew-resize select-none rounded-lg bg-black/50 px-2 py-2 ring-1 ring-white/10 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex h-full w-full items-stretch justify-center gap-2">
          {Array.from({ length: POWER_BAR_SEGMENTS }).map((_, i) => {
            const active = i < barsLit;
            return (
              <div
                key={i}
                className="h-full shrink-0 rounded-full"
                style={{
                  width: 4,
                  minWidth: 4,
                  backgroundColor: active ? '#2ea043' : 'rgba(255,255,255,0.9)',
                  opacity: active ? 1 : 0.55,
                }}
              />
            );
          })}
        </div>

        <div
          className={`pointer-events-none absolute bottom-2 top-2 w-px bg-white/80 ${
            dragging ? '' : 'transition-[left] duration-75'
          }`}
          style={{ left: thumbLeft }}
        />

        <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/[0.04]" />
      </div>
      <div className="mt-0.5 text-center text-[9px] text-white/30">{sourceLeg === 'right' ? 'R' : 'L'}</div>
    </div>
  );
}
