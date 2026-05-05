import { useCallback, useEffect, useRef, useState } from 'react';
import { POWER_BAR_SEGMENTS } from '../../lib/motorConstants.js';
import { useSession } from '../../context/SessionContext.jsx';
import { applyCoupledDelta } from '../../services/assistCoupling.js';
import { SegmentedAssistBar } from './SegmentedAssistBar.jsx';

const RATIO_PRESETS = [0.2, 0.3, 0.4, 0.5, 0.6];

function snapToRail(v) {
  const x = Math.min(100, Math.max(0, v));
  const bars = Math.round((x / 100) * POWER_BAR_SEGMENTS);
  return (bars / POWER_BAR_SEGMENTS) * 100;
}

/** Natural height: never shrink-wrap clips bars; parent scrolls if needed. */
export function DualLegAssistPanel() {
  const { rightAssist, setRightAssist, leftAssist, setLeftAssist, couplingRatio, setCouplingRatio } =
    useSession();

  const [holdRight, setHoldRight] = useState(false);
  const [holdLeft, setHoldLeft] = useState(false);
  const [couplingFromSlider, setCouplingFromSlider] = useState(false);

  const rightRef = useRef(rightAssist);
  const leftRef = useRef(leftAssist);

  useEffect(() => {
    rightRef.current = rightAssist;
    leftRef.current = leftAssist;
  }, [rightAssist, leftAssist]);

  const handleRightAbsolute = useCallback(
    (nextR) => {
      const snappedTarget = snapToRail(nextR);
      const delta = snappedTarget - rightRef.current;
      if (Math.abs(delta) < 0.0001) return;
      const { right, left } = applyCoupledDelta({
        sourceLeg: 'right',
        right: rightRef.current,
        left: leftRef.current,
        delta,
        couplingRatio,
      });
      let sr = snapToRail(right);
      let sl = snapToRail(left);
      if (holdLeft) sl = snapToRail(leftRef.current);
      rightRef.current = sr;
      leftRef.current = sl;
      setRightAssist(sr);
      setLeftAssist(sl);
    },
    [couplingRatio, holdLeft, setLeftAssist, setRightAssist],
  );

  const handleLeftAbsolute = useCallback(
    (nextL) => {
      const snappedTarget = snapToRail(nextL);
      const delta = snappedTarget - leftRef.current;
      if (Math.abs(delta) < 0.0001) return;
      const { right, left } = applyCoupledDelta({
        sourceLeg: 'left',
        right: rightRef.current,
        left: leftRef.current,
        delta,
        couplingRatio,
      });
      let sr = snapToRail(right);
      let sl = snapToRail(left);
      if (holdRight) sr = snapToRail(rightRef.current);
      rightRef.current = sr;
      leftRef.current = sl;
      setRightAssist(sr);
      setLeftAssist(sl);
    },
    [couplingRatio, holdRight, setLeftAssist, setRightAssist],
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <SegmentedAssistBar
        label="Right leg"
        value={rightAssist}
        hold={holdRight}
        onHoldChange={setHoldRight}
        onChange={handleRightAbsolute}
      />
      <SegmentedAssistBar
        label="Left leg"
        value={leftAssist}
        hold={holdLeft}
        onHoldChange={setHoldLeft}
        onChange={handleLeftAbsolute}
      />

      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
        {RATIO_PRESETS.map((r) => {
          const active = Math.abs(couplingRatio - r) < 0.001;
          return (
            <button
              key={r}
              type="button"
              onClick={() => {
                setCouplingRatio(r);
                setCouplingFromSlider(false);
              }}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 transition ${
                active
                  ? 'bg-[#1a4d2e] text-[#b6f5c8] ring-[#34c759]/35'
                  : 'bg-white/5 text-[#8e8e93] ring-white/10 hover:text-white'
              }`}
            >
              {Math.round(r * 100)}%
            </button>
          );
        })}
        <div className="flex items-center">
          <input
            type="range"
            min={10}
            max={90}
            step={1}
            value={Math.round(couplingRatio * 100)}
            onChange={(e) => {
              setCouplingRatio(Number(e.target.value) / 100);
              setCouplingFromSlider(true);
            }}
            className="h-1 w-32 max-w-[32vw] shrink-0 appearance-none rounded-full bg-white/10 accent-[#34c759]"
            aria-label="Coupling ratio"
          />
          {couplingFromSlider ? (
            <span className="ml-[7px] shrink-0 text-[11px] font-semibold tabular-nums text-[#b6f5c8]">
              {Math.round(couplingRatio * 100)}%
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
