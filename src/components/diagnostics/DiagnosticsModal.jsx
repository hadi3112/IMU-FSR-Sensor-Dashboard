import { useCallback, useState } from 'react';
import { useSession } from '../../context/SessionContext.jsx';
import { runDiagnosticsPipeline } from '../../services/diagnosticsRunner.js';

/** @typedef {{ id: string; title: string; detail?: string; state: 'pending'|'running'|'ok'|'fail' }} Row */

const INITIAL_ROWS = /** @type {Row[]} */ ([
  { id: 'wifi', title: 'Wi‑Fi verification (MyPiHotspot)', state: 'pending' },
  { id: 'mqtt', title: 'MQTT session handshake', state: 'pending' },
  { id: 'topics', title: 'Topic subscriptions configured', state: 'pending' },
]);

/**
 * @param {{ open: boolean; onClose: () => void }} props
 */
export function DiagnosticsModal({ open, onClose }) {
  const {
    mqttHost,
    mqttPort,
    connectMqtt,
    mqttConnected,
    setSessionActive,
    setDiagnosticsPassed,
  } = useSession();

  const [rows, setRows] = useState(INITIAL_ROWS);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState(/** @type {null | { ok: boolean; text: string }} */ (null));

  const upsertRow = useCallback((row) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === row.id);
      if (idx === -1) return [...prev, row];
      const next = [...prev];
      next[idx] = { ...next[idx], ...row };
      return next;
    });
  }, []);

  const resetUi = useCallback(() => {
    setRows(INITIAL_ROWS);
    setSummary(null);
  }, []);

  const ensureMqttConnected = useCallback(async () => {
    if (mqttConnected) return { ok: true };
    const res = await connectMqtt();
    if (res?.ok) return { ok: true };
    return { ok: false, message: res?.message ?? 'Unable to connect to MQTT broker' };
  }, [connectMqtt, mqttConnected]);

  const run = useCallback(async () => {
    setRunning(true);
    setSummary(null);
    try {
      setRows(INITIAL_ROWS);

      const res = await runDiagnosticsPipeline({
        ensureMqttConnected,
        healthTimeoutMs: 6500,
        onRowUpdate: upsertRow,
      });

      if (res.ok) {
        setDiagnosticsPassed(true);
        setSessionActive(false);
        setSummary({ ok: true, text: 'SET UP SUCCESSFUL' });
      } else {
        setDiagnosticsPassed(false);
        setSessionActive(false);
        setSummary({ ok: false, text: 'Validation incomplete — resolve failed checks and retry.' });
      }
    } catch (e) {
      setDiagnosticsPassed(false);
      setSessionActive(false);
      setSummary({
        ok: false,
        text: e instanceof Error ? e.message : 'Unexpected diagnostics failure',
      });
    } finally {
      setRunning(false);
    }
  }, [ensureMqttConnected, mqttHost, mqttPort, setDiagnosticsPassed, setSessionActive, upsertRow]);

  const completed = !running && summary !== null;
  const succeeded = completed && summary?.ok === true;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#1c1c1e] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.75)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/5 px-2 py-1 text-[12px] font-semibold text-white/70 ring-1 ring-white/10 hover:bg-white/10"
        >
          Close
        </button>

        <div className="pr-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8e8e93]">Pre-session</div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Diagnostics & validation</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[#8e8e93]">
            Friendly system checks before enabling a walking session. Dashboard validates Pi hotspot connectivity,
            broker link, and stream wiring on esp/stepper.
          </p>
        </div>

        <div className="mt-5 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {rows.map((r) => {
            const state =
              r.state === 'ok' ? (
                <span className="text-[#34c759]">PASS</span>
              ) : r.state === 'fail' ? (
                <span className="text-red-400">FAIL</span>
              ) : r.state === 'running' ? (
                <span className="text-[#ff9500]">RUNNING</span>
              ) : (
                <span className="text-[#8e8e93]">PENDING</span>
              );
            return (
              <div key={r.id} className="rounded-2xl border border-white/5 bg-black/35 p-3 ring-1 ring-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white">{r.title}</div>
                    {r.detail && <div className="mt-1 text-[12px] text-[#8e8e93]">{r.detail}</div>}
                  </div>
                  <div className="shrink-0 text-[11px] font-bold">{state}</div>
                </div>
              </div>
            );
          })}
        </div>

        {summary && (
          <div
            className={`mt-4 rounded-2xl border px-3 py-3 text-[13px] font-semibold ${
              summary.ok ? 'border-[#34c759]/35 bg-[#34c759]/10 text-[#d7ffe4]' : 'border-red-500/30 bg-red-500/10 text-red-100'
            }`}
          >
            {summary.text}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          {completed ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-black"
              >
                Exit Diagnostics
              </button>
              {succeeded && (
                <button
                  type="button"
                  onClick={() => void run()}
                  className="rounded-xl bg-white/10 px-3 py-2 text-[13px] font-semibold text-white ring-1 ring-white/10"
                >
                  Rerun
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={running}
                onClick={() => void run()}
                className="flex-1 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-black disabled:opacity-40"
              >
                {running ? 'Running…' : 'Run diagnostics'}
              </button>
              <button
                type="button"
                disabled={running}
                onClick={resetUi}
                className="rounded-xl bg-white/10 px-3 py-2 text-[13px] font-semibold text-white ring-1 ring-white/10 disabled:opacity-40"
              >
                Reset view
              </button>
            </>
          )}
        </div>

        <div className="mt-2 text-[10px] text-white/30">Wi‑Fi → MQTT → esp/stepper stream readiness.</div>
      </div>
    </div>
  );
}
