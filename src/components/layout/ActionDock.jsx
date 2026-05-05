/**
 * Bottom primary actions — fixed above tab bar, ~20vh tall zone, centered gradient CTAs.
 */
export function ActionDock({ onRunDiagnostics, onStartSession, diagnosticsPassed }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 flex items-center justify-center px-4"
      style={{
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
        height: 'min(20vh, 168px)',
      }}
    >
      <div className="pointer-events-auto flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onRunDiagnostics}
          className="min-w-[160px] rounded-2xl bg-gradient-to-br from-white via-[#e8f7ff] to-[#9dd1ff] px-6 py-3 text-[12px] font-bold uppercase tracking-wide text-[#0a0a0c] shadow-[0_12px_40px_rgba(157,209,255,0.35)] ring-1 ring-white/40 transition hover:brightness-105 active:scale-[0.99]"
        >
          Run diagnostics
        </button>
        <button
          type="button"
          disabled={!diagnosticsPassed}
          onClick={onStartSession}
          className="min-w-[160px] rounded-2xl bg-gradient-to-br from-[#7ef7b5] via-[#34c759] to-[#0d7a3b] px-6 py-3 text-[12px] font-bold uppercase tracking-wide text-[#03140a] shadow-[0_16px_48px_rgba(52,199,89,0.45)] ring-1 ring-[#9cffc0]/50 transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Start session
        </button>
      </div>
    </div>
  );
}
