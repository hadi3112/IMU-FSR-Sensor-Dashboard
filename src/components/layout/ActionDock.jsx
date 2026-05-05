/**
 * Diagnostics = lighter green band; Start = darker band (swapped from prior).
 */
export function ActionDock({ onRunDiagnostics, onStartSession, diagnosticsPassed }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 flex items-center justify-center px-4"
      style={{
        bottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))',
        height: 'min(18vh, 152px)',
      }}
    >
      <div className="pointer-events-auto flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onRunDiagnostics}
          className="min-w-[168px] rounded-2xl bg-gradient-to-b from-[#0a4a48] to-[#062a28] px-6 py-3 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(255,255,255,0.11)] ring-1 ring-white/12 transition enabled:hover:brightness-110 active:scale-[0.99]"
        >
          Run diagnostics
        </button>
        <button
          type="button"
          disabled={!diagnosticsPassed}
          onClick={onStartSession}
          className="min-w-[168px] rounded-2xl bg-gradient-to-b from-[#3ad4a8] to-[#157a4a] px-6 py-3 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(255,255,255,0.11)] ring-1 ring-white/15 transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Start session
        </button>
      </div>
    </div>
  );
}
