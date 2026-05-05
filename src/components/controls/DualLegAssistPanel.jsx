import { useCallback, useRef } from 'react';
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

export function DualLegAssistPanel() {
  const { rightAssist, setRightAssist, leftAssist, setLeftAssist, couplingRatio, setCouplingRatio } =
    useSession();

  const rightRef = useRef(rightAssist);
  const leftRef = useRef(leftAssist);
  rightRef.current = rightAssist;
  leftRef.current = leftAssist;

  const handleRightAbsolute = useCallback(
    (nextR) => {
      const delta = nextR - rightRef.current;
      if (Math.abs(delta) < 0.0001) return;
      const { right, left } = applyCoupledDelta({
        sourceLeg: 'right',
        right: rightRef.current,
        left: leftRef.current,
        delta,
        couplingRatio,
      });
      setRightAssist(snapToRail(right));
      setLeftAssist(snapToRail(left));
    },
    [couplingRatio, setLeftAssist, setRightAssist],
  );

  const handleLeftAbsolute = useCallback(
    (nextL) => {
      const delta = nextL - leftRef.current;
      if (Math.abs(delta) < 0.0001) return;
      const { right, left } = applyCoupledDelta({
        sourceLeg: 'left',
        right: rightRef.current,
        left: leftRef.current,
        delta,
        couplingRatio,
      });
      setRightAssist(snapToRail(right));
      setLeftAssist(snapToRail(left));
    },
    [couplingRatio, setLeftAssist, setRightAssist],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-start gap-2 py-1">
      <SegmentedAssistBar label="Right leg" value={rightAssist} sourceLeg="right" onChange={handleRightAbsolute} />
      <SegmentedAssistBar label="Left leg" value={leftAssist} sourceLeg="left" onChange={handleLeftAbsolute} />

      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
        {RATIO_PRESETS.map((r) => {
          const active = Math.abs(couplingRatio - r) < 0.001;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setCouplingRatio(r)}
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
        <input
          type="range"
          min={10}
          max={90}
          step={1}
          value={Math.round(couplingRatio * 100)}
          onChange={(e) => setCouplingRatio(Number(e.target.value) / 100)}
          className="h-1 w-32 max-w-[32vw] appearance-none rounded-full bg-white/10 accent-[#34c759]"
          aria-label="Coupling ratio"
        />
      </div>
    </div>
  );
}
