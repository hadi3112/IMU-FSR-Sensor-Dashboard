import { useState } from 'react';
import { SessionProvider, useSession } from './context/SessionContext.jsx';
import { ExoHeroScene } from './components/hero/ExoHeroScene.jsx';
import { TelemetryStrip } from './components/layout/TelemetryStrip.jsx';
import { TabBar } from './components/layout/TabBar.jsx';
import { ActionDock } from './components/layout/ActionDock.jsx';
import { DevicesTab } from './components/tabs/DevicesTab.jsx';
import { StatsTab } from './components/tabs/StatsTab.jsx';
import { ProfileTab } from './components/tabs/ProfileTab.jsx';
import { DiagnosticsModal } from './components/diagnostics/DiagnosticsModal.jsx';

function Shell() {
  const { activeTab, diagnosticsPassed, setSessionActive } = useSession();
  const [diagOpen, setDiagOpen] = useState(false);

  const bottomPad =
    activeTab === 'devices'
      ? 'calc(3.5rem + min(20vh, 168px) + 6px)'
      : 'calc(3.5rem + env(safe-area-inset-bottom, 0px))';

  return (
    <div className="flex h-screen min-h-0 flex-col overscroll-none bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(52,199,89,0.12),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(120,180,255,0.08),transparent_45%),#000000] text-white">
      <DiagnosticsModal open={diagOpen} onClose={() => setDiagOpen(false)} />

      <header className="flex shrink-0 items-center justify-between px-4 pb-1 pt-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#34c759] shadow-[0_0_14px_rgba(52,199,89,0.65)]" />
          <div className="bg-gradient-to-r from-white to-[#9dd1ff] bg-clip-text text-[14px] font-bold tracking-tight text-transparent">
            Stryder
          </div>
        </div>
        <button
          type="button"
          className="rounded-full bg-white/5 p-2 text-white/60 ring-1 ring-white/10 hover:bg-white/10"
          title="Messages"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 6h16v10H7l-3 3V6Z" />
          </svg>
        </button>
      </header>

      <main
        className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-2 px-3"
        style={{ paddingBottom: bottomPad }}
      >
        <ExoHeroScene />
        <TelemetryStrip />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeTab === 'devices' && <DevicesTab />}
          {activeTab === 'stats' && <StatsTab />}
          {activeTab === 'profile' && <ProfileTab />}
        </div>
      </main>

      {activeTab === 'devices' && (
        <ActionDock
          onRunDiagnostics={() => setDiagOpen(true)}
          onStartSession={() => setSessionActive(true)}
          diagnosticsPassed={diagnosticsPassed}
        />
      )}

      <TabBar />
    </div>
  );
}

export function App() {
  return (
    <SessionProvider>
      <Shell />
    </SessionProvider>
  );
}
