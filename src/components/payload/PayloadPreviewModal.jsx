import { useEffect } from 'react';
import { usePayloadLog } from '../../context/PayloadLogContext.jsx';

/**
 * Floating payload log: no backdrop blur or dimming; main UI (power rails) stays fully interactive.
 *
 * @param {{ open: boolean; onClose: () => void }} props
 */
export function PayloadPreviewModal({ open, onClose }) {
  const { rows, clear } = usePayloadLog();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed right-2 top-[4.5rem] z-[70] flex w-[min(calc(100vw-1rem),22rem)] max-h-[calc(100dvh-5rem)] flex-col sm:right-4 sm:top-[4.75rem] sm:max-h-[calc(100dvh-5.25rem)] sm:w-[min(calc(100vw-2rem),24rem)]">
      <div
        className="pointer-events-auto flex min-h-0 max-h-full flex-col rounded-[40px] border border-white/10 bg-[#121214] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-cyan-900/30"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="false"
        aria-label="Payload log"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="text-[12px] font-bold uppercase tracking-wider text-[#5ee8dc]">View payload</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => clear()}
              className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/15"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/15"
            >
              Close
            </button>
          </div>
        </div>
        <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 font-mono text-[10px] leading-relaxed text-[#b8e8e4]">
          {rows.length === 0 ? (
            <div className="rounded-2xl bg-black/40 p-3 text-[11px] text-white/45 ring-1 ring-white/5">
              <p className="mb-2 text-white/60">No MQTT motor frames logged yet.</p>
              <p className="text-white/35">When stepper topics are selected and the broker is connected, JSON payloads
                appear here exactly as sent.</p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-black/50 p-2 text-[9px] text-[#7dd3ce]/80">
{`// example frame
{
  "leg": "right",
  "targetMicrostepCounts": 120,
  "barsLit": 12,
  "targetAssistPercent": 60,
  "sequence": 1,
  "sessionId": "…"
}`}
              </pre>
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/5 bg-black/35 p-2 ring-1 ring-white/5">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-1 text-[9px] text-[#5ee8dc]/80">
                  <span className="truncate">{r.topic}</span>
                  <span className="text-white/35">{new Date(r.ts).toLocaleTimeString()}</span>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[9px] text-[#d4f4f0]">
                  {JSON.stringify(r.payload, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
