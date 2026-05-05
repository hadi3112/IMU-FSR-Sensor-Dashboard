import { TelemetryStrip } from '../layout/TelemetryStrip.jsx';
import { DualLegAssistPanel } from '../controls/DualLegAssistPanel.jsx';
import { Exo3DPanel } from './Exo3DPanel.jsx';

/** Left: telemetry + power rails. Right: 3D optics. Offset below tabs. */
export function HeroWorkspace() {
  return (
    <div className="flex min-h-0 flex-1 gap-2 overflow-hidden pt-[100px]">
      <div className="relative z-20 flex w-1/2 min-w-0 flex-col gap-3 overflow-visible">
        <div className="relative z-30 shrink-0">
          <TelemetryStrip />
        </div>
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pb-2">
          <DualLegAssistPanel />
        </div>
      </div>
      <div className="relative z-10 flex w-1/2 min-w-0 min-h-0 flex-col overflow-hidden">
        <Exo3DPanel />
      </div>
    </div>
  );
}
