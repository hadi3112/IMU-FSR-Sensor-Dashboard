import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { clampPct } from '../../services/assistCoupling.js';
import { percentToNemaStepCounts } from '../../services/assistTranslation.js';
import { POWER_BAR_SEGMENTS } from '../../lib/motorConstants.js';

/** Each lit segment is a vertical stroke (px) centered in an equal-width slot. */
const BAR_STROKE_PX = 4;
/** Drag cursor: wider than bars, taller, pokes past the track. */
const CURSOR_STROKE_PX = 8;
const CURSOR_HEIGHT_OVERHANG_PX = 10;

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
 *  onChange: (next: number) => void;
 *  hold: boolean;
 *  onHoldChange: (next: boolean) => void;
 * }} props
 */
export function SegmentedAssistBar({ label, value, onChange, hold, onHoldChange }) {
  const trackRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const drag = useRef({ active: false, pointerId: 0 });
  const [dragging, setDragging] = useState(false);
  const [cursorLeftPx, setCursorLeftPx] = useState(0);

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

  /** Right edge (px from track left) of the rightmost green stroke; cursor is centered on it. */
  const recomputeCursorLeft = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const w = el.getBoundingClientRect().width;
    if (w <= 0) return;
    const slotW = w / POWER_BAR_SEGMENTS;
    let rightEdgePx;
    if (barsLit <= 0) {
      rightEdgePx = 0;
    } else if (barsLit >= POWER_BAR_SEGMENTS) {
      rightEdgePx = (POWER_BAR_SEGMENTS - 0.5) * slotW + BAR_STROKE_PX / 2;
    } else {
      rightEdgePx = (barsLit - 0.5) * slotW + BAR_STROKE_PX / 2;
    }
    const halfC = CURSOR_STROKE_PX / 2;
    const left = rightEdgePx - halfC;
    setCursorLeftPx(Math.max(-halfC, Math.min(left, w - halfC)));
  }, [barsLit]);

  useLayoutEffect(() => {
    recomputeCursorLeft();
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => recomputeCursorLeft());
    ro.observe(el);
    return () => ro.disconnect();
  }, [recomputeCursorLeft]);

  return (
    <div className="w-full shrink-0 overflow-visible rounded-lg border border-white/10 bg-gradient-to-b from-[#1a1c1e] to-[#121416] p-2 ring-1 ring-white/5">
      <div className="mb-1 flex items-end justify-between gap-2">
        <div className="text-[14px] font-semibold uppercase tracking-[0.14em] text-[#8e8e93]">{label}</div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            aria-pressed={hold}
            onClick={() => onHoldChange(!hold)}
            className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 transition ${
              hold
                ? 'bg-[#2a4a6e] text-[#a8d4ff] ring-[#5ac8fa]/40'
                : 'bg-white/5 text-[#8e8e93] ring-white/12 hover:text-white'
            }`}
          >
            Hold
          </button>
          <div className="text-right">
            <div className="text-xl font-semibold tabular-nums text-[#34c759]">{counts}</div>
            <div className="text-[9px] font-medium text-[#6e6e73]">counts</div>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative mx-auto h-[2.94rem] w-full cursor-ew-resize select-none overflow-visible rounded-lg bg-black/50 py-1 ring-1 ring-white/10 touch-none"
        style={{ minHeight: '2.94rem' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="relative z-0 flex h-full w-full min-h-0 items-stretch">
          {Array.from({ length: POWER_BAR_SEGMENTS }).map((_, i) => {
            const active = i < barsLit;
            return (
              <div key={i} className="flex h-full min-w-0 flex-1 items-center justify-center">
                <div
                  className="h-full shrink-0 rounded-full"
                  style={{
                    width: BAR_STROKE_PX,
                    minWidth: BAR_STROKE_PX,
                    backgroundColor: active ? '#2ea043' : 'rgba(255,255,255,0.9)',
                    opacity: active ? 1 : 0.55,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div
          className={`pointer-events-none absolute left-0 z-20 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.45)] ring-1 ring-white/30 ${
            dragging ? '' : 'transition-[left] duration-75'
          }`}
          style={{
            width: CURSOR_STROKE_PX,
            minWidth: CURSOR_STROKE_PX,
            left: cursorLeftPx,
            top: '50%',
            height: `calc(100% + ${CURSOR_HEIGHT_OVERHANG_PX * 2}px)`,
            transform: 'translate(-50%, -50%)',
          }}
        />

        <div className="pointer-events-none absolute inset-0 z-10 rounded-lg ring-1 ring-inset ring-white/[0.04]" />
      </div>
    </div>
  );
}
