import { useCallback, useMemo, useRef, useState } from 'react';
import { clampPct } from '../../services/assistCoupling.js';
import { percentToNemaStepCounts } from '../../services/assistTranslation.js';

const SEGMENTS = 100;

function snapPercentToBars(pct) {
  const v = clampPct(pct);
  return Math.min(100, Math.max(0, Math.round((v / 100) * SEGMENTS)));
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

  const snappedPct = useMemo(() => snapPercentToBars(value), [value]);
  const counts = useMemo(() => percentToNemaStepCounts(snappedPct).targetMicrostepCounts, [snappedPct]);

  const valueFromClientY = useCallback((clientY) => {
    const el = trackRef.current;
    if (!el) return snappedPct;
    const r = el.getBoundingClientRect();
    const t = (clientY - r.top) / r.height;
    const pct = (1 - t) * 100;
    return snapPercentToBars(pct);
  }, [snappedPct]);

  const onPointerDown = (e) => {
    drag.current = { active: true, pointerId: e.pointerId };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(valueFromClientY(e.clientY));
  };

  const onPointerMove = (e) => {
    if (!drag.current.active || e.pointerId !== drag.current.pointerId) return;
    onChange(valueFromClientY(e.clientY));
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

  const thumbLeft = `calc(${(snappedPct / 100) * 100}% - 1.5px)`;

  return (
    <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-gradient-to-b from-[#1f1f24] to-[#141416] p-3 shadow-[0_0_40px_rgba(52,199,89,0.06)] ring-1 ring-white/5">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e8e93]">{label}</div>
        <div className="text-right">
          <div className="text-2xl font-semibold tracking-tight text-[#34c759] tabular-nums">{counts}</div>
          <div className="text-[10px] font-medium text-[#8e8e93]">counts · {snappedPct}%</div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative mx-auto h-24 w-full max-w-3xl select-none rounded-xl bg-black/55 px-1 py-1.5 ring-1 ring-white/10"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex h-full w-full items-stretch justify-between gap-px">
          {Array.from({ length: SEGMENTS }).map((_, i) => {
            const active = i < snappedPct;
            return (
              <div
                key={i}
                className={`relative min-w-0 flex-1 rounded-[2px] ${
                  dragging ? '' : 'transition-[background-color,box-shadow] duration-75'
                } ${
                  active
                    ? 'bg-gradient-to-b from-[#5ef2a0] to-[#1fa34d] shadow-[0_0_10px_rgba(52,199,89,0.35)]'
                    : 'bg-[#2a2a2e]'
                }`}
              />
            );
          })}
        </div>

        <div
          className={`pointer-events-none absolute bottom-1.5 top-1.5 w-[2px] rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.45)] ${
            dragging ? '' : 'transition-[left] duration-75'
          }`}
          style={{ left: thumbLeft }}
        />

        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.05] to-transparent" />
      </div>
      <div className="mt-1 text-center text-[10px] text-white/25">{sourceLeg === 'right' ? 'R' : 'L'}</div>
    </div>
  );
}
