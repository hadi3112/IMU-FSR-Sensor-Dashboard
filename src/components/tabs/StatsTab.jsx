export function StatsTab() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-hidden pb-1">
      {['Symmetry', 'Torque'].map((t) => (
        <div
          key={t}
          className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1f] to-[#101012] p-3 ring-1 ring-white/5"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">{t}</div>
          <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-[#34c759]">Soon</div>
          <div className="mt-2 flex-1 rounded-xl bg-gradient-to-b from-white/[0.06] to-transparent ring-1 ring-white/5" />
        </div>
      ))}
    </div>
  );
}
