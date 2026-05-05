import { TelemetryStrip } from '../layout/TelemetryStrip.jsx';
import { DualLegAssistPanel } from '../controls/DualLegAssistPanel.jsx';
import { Exo3DPanel } from './Exo3DPanel.jsx';

/**
 * Left: telemetry + power rails at natural height (no inner scroll — main scrolls).
 * Right: 3D stretches to match row height. Row uses default stretch so rail column sets height.
 */
export function HeroWorkspace() {
  return (
    <div className="flex min-h-0 flex-1 gap-2 overflow-x-hidden pt-[40px]">
      <div className="flex w-1/2 min-w-0 shrink-0 flex-col gap-3">
        <div className="shrink-0">
          <TelemetryStrip />
        </div>
        <DualLegAssistPanel />
      </div>
      <div className="flex w-1/2 min-w-0 min-h-0 flex-col">
        <Exo3DPanel />
      </div>
    </div>
  );
}
