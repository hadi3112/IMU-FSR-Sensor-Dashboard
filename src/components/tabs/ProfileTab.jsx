import { useSession } from '../../context/SessionContext.jsx';

export function ProfileTab() {
  const { sessionId } = useSession();
  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-hidden text-[11px]">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1f] to-[#101012] p-3 ring-1 ring-white/5">
        <div className="text-[9px] font-bold uppercase tracking-wider text-[#8e8e93]">Session</div>
        <div className="mt-1 break-all font-mono text-[10px] text-[#34c759]">{sessionId}</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1f] to-[#101012] p-3 ring-1 ring-white/5">
        <div className="text-[9px] font-bold uppercase tracking-wider text-[#8e8e93]">History</div>
        <div className="mt-1 text-[10px] text-white/45">No prior sessions.</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1f] to-[#101012] p-3 ring-1 ring-white/5">
        <div className="text-[9px] font-bold uppercase tracking-wider text-[#8e8e93]">Firmware</div>
        <div className="mt-1 font-mono text-[10px] text-white/45">—</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1f] to-[#101012] p-3 ring-1 ring-white/5">
        <div className="text-[9px] font-bold uppercase tracking-wider text-[#8e8e93]">Telemetry</div>
        <div className="mt-1 text-[10px] text-white/45">No archives.</div>
      </div>
    </div>
  );
}
