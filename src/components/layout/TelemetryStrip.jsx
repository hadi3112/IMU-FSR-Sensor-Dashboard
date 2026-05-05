import { useEffect, useRef, useState } from 'react';
import { ALL_SUBSCRIBABLE_TOPICS } from '../../lib/mqttTopics.js';
import { useSession } from '../../context/SessionContext.jsx';

function fmtUptime(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const TOPIC_SHORT = {
  'ESP/SSR': 'SSR',
  'ESP/IMUS': 'IMU',
  'ESP/stepper_right': 'R step',
  'ESP/stepper_left': 'L step',
};

export function TelemetryStrip() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const {
    batteryPct,
    mqttConnected,
    speedKmh,
    uptimeSec,
    mqttHost,
    setMqttHost,
    mqttPort,
    setMqttPort,
    mqttReconnect,
    setMqttReconnect,
    connectMqtt,
    disconnectMqtt,
    selectedTopics,
    toggleTopic,
  } = useSession();

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      const el = rootRef.current;
      if (el && !el.contains(/** @type {Node} */ (e.target))) setMenuOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const onConnect = async () => {
    setBusy(true);
    try {
      await connectMqtt();
    } finally {
      setBusy(false);
    }
  };

  const metrics = [
    {
      key: 'bat',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#ff9500]" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="6" y="7" width="10" height="10" rx="2" />
          <path d="M9 5h6v2H9z" />
        </svg>
      ),
      value: `${batteryPct}%`,
      label: 'Battery',
    },
    {
      key: 'conn',
      icon: (
        <span
          className={`inline-block h-2 w-2 rounded-full ${mqttConnected ? 'bg-[#34c759] shadow-[0_0_10px_rgba(52,199,89,0.7)]' : 'bg-[#8e8e93]'}`}
        />
      ),
      value: mqttConnected ? 'Live' : 'Down',
      label: 'Link',
    },
    {
      key: 'up',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 6v12M8 10l4-4 4 4" />
        </svg>
      ),
      value: fmtUptime(uptimeSec),
      label: 'Uptime',
    },
    {
      key: 'spd',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      ),
      value: `${speedKmh.toFixed(1)} km/h`,
      label: 'Gait',
    },
  ];

  return (
    <div
      ref={rootRef}
      className="relative shrink-0 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1b1b20] via-[#151518] to-[#0f0f12] p-2 shadow-[0_12px_48px_rgba(0,0,0,0.55)] ring-1 ring-white/5"
    >
      <div className="grid grid-cols-4 divide-x divide-white/10">
        {metrics.map((s) => (
          <div key={s.key} className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-center">
            {s.icon}
            <div className="text-[12px] font-semibold tracking-tight text-white">{s.value}</div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-[#8e8e93]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/5 px-2 py-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selectedTopics.length === 0 ? (
            <span className="text-[10px] text-white/35">No topics</span>
          ) : (
            selectedTopics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTopic(t, false)}
                className="inline-flex items-center gap-1 rounded-full bg-[#34c759]/12 px-2 py-0.5 text-[10px] font-semibold text-[#b8ffd0] ring-1 ring-[#34c759]/30 hover:bg-[#34c759]/20"
                title="Remove topic"
              >
                <span className="max-w-[120px] truncate">{TOPIC_SHORT[t] ?? t}</span>
                <span className="text-white/50">×</span>
              </button>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="shrink-0 rounded-full bg-gradient-to-r from-white/15 to-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/15 hover:from-white/25"
        >
          MQTT {menuOpen ? '▴' : '▾'}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute left-2 right-2 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-[#121214]/95 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur-md ring-1 ring-white/10">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] text-[#8e8e93]">
              Host
              <input
                value={mqttHost}
                onChange={(e) => setMqttHost(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#34c759]/50"
              />
            </label>
            <label className="text-[10px] text-[#8e8e93]">
              Port
              <input
                value={mqttPort}
                onChange={(e) => setMqttPort(Number(e.target.value))}
                type="number"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#34c759]/50"
              />
            </label>
          </div>
          <label className="mt-2 flex items-center justify-between gap-2 text-[10px] text-white/70">
            Reconnect
            <input
              type="checkbox"
              checked={mqttReconnect}
              onChange={(e) => setMqttReconnect(e.target.checked)}
              className="accent-[#34c759]"
            />
          </label>
          <div className="mt-2 space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8e8e93]">Topics</div>
            {ALL_SUBSCRIBABLE_TOPICS.map((topic) => {
              const on = selectedTopics.includes(topic);
              return (
                <label
                  key={topic}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5 text-[11px] ring-1 ring-white/5 hover:bg-white/[0.06]"
                >
                  <span className="truncate text-white/90">{topic}</span>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => toggleTopic(topic, e.target.checked)}
                    className="accent-[#34c759]"
                  />
                </label>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy || mqttConnected}
              onClick={() => void onConnect()}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#5ef2a0] to-[#1fa34d] px-2 py-2 text-[11px] font-bold text-black disabled:opacity-40"
            >
              Connect
            </button>
            <button
              type="button"
              disabled={busy || !mqttConnected}
              onClick={() => void disconnectMqtt()}
              className="flex-1 rounded-xl bg-white/10 px-2 py-2 text-[11px] font-bold text-white ring-1 ring-white/10 disabled:opacity-40"
            >
              Off
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
