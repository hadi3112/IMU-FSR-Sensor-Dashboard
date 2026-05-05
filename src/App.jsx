import { useState } from 'react';
import { SessionProvider, useSession } from './context/SessionContext.jsx';
import { PayloadLogProvider } from './context/PayloadLogContext.jsx';
import { TabBar } from './components/layout/TabBar.jsx';
import { ActionDock } from './components/layout/ActionDock.jsx';
import { HeroWorkspace } from './components/hero/HeroWorkspace.jsx';
import { StatsTab } from './components/tabs/StatsTab.jsx';
import { ProfileTab } from './components/tabs/ProfileTab.jsx';
import { DiagnosticsModal } from './components/diagnostics/DiagnosticsModal.jsx';
import { CommandStreamBridge } from './components/devices/CommandStreamBridge.jsx';
import { ViewPayloadFab } from './components/payload/ViewPayloadFab.jsx';
import { PayloadPreviewModal } from './components/payload/PayloadPreviewModal.jsx';

function Shell() {
  const { activeTab, diagnosticsPassed, setSessionActive } = useSession();
  const [diagOpen, setDiagOpen] = useState(false);
  const [payloadOpen, setPayloadOpen] = useState(false);

  const bottomPad =
    activeTab === 'devices'
      ? 'calc(6.5rem + min(18vh, 152px) + 12px + env(safe-area-inset-bottom, 0px))'
      : 'calc(1.25rem + env(safe-area-inset-bottom, 0px))';

  return (
    <div className="app-shell flex h-screen min-h-0 flex-col overscroll-none text-white">
      <DiagnosticsModal open={diagOpen} onClose={() => setDiagOpen(false)} />
      <PayloadPreviewModal open={payloadOpen} onClose={() => setPayloadOpen(false)} />
      <CommandStreamBridge />

      <header className="flex shrink-0 items-center justify-between px-4 pb-0 pt-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#5ee8dc] shadow-[0_0_6px_rgba(94,232,220,0.28)]" />
          <div className="bg-gradient-to-r from-white to-[#7dd3c0] bg-clip-text text-[14px] font-bold tracking-tight text-transparent">
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

      <TabBar />

      <main
        className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3"
        style={{ paddingBottom: bottomPad }}
      >
        {activeTab === 'devices' && <HeroWorkspace />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </main>

      {activeTab === 'devices' && (
        <ActionDock
          onRunDiagnostics={() => setDiagOpen(true)}
          onStartSession={() => setSessionActive(true)}
          diagnosticsPassed={diagnosticsPassed}
        />
      )}

      <ViewPayloadFab onOpen={() => setPayloadOpen(true)} />
    </div>
  );
}

export function App() {
  return (
    <SessionProvider>
      <PayloadLogProvider>
        <Shell />
      </PayloadLogProvider>
    </SessionProvider>
  );
}
