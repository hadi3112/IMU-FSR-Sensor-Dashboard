import { useSession } from '../../context/SessionContext.jsx';

const tabs = [
  { id: 'devices', label: 'Devices', icon: DevicesIcon },
  { id: 'stats', label: 'Stats', icon: StatsIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
];

function DevicesIcon({ active }) {
  const c = active ? '#ffffff' : '#8e8e93';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6">
      <rect x="5" y="6" width="14" height="12" rx="2" />
      <path d="M9 10h6M9 14h4" />
    </svg>
  );
}

function StatsIcon({ active }) {
  const c = active ? '#ffffff' : '#8e8e93';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6">
      <path d="M5 19V5M10 19V9M15 19v-6M20 19v-9" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  const c = active ? '#ffffff' : '#8e8e93';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function TabBar() {
  const { activeTab, setActiveTab } = useSession();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-gradient-to-t from-black via-black/95 to-transparent pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-stretch justify-around px-4 py-1.5">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${
                active ? 'text-white' : 'text-[#8e8e93]'
              }`}
            >
              <Icon active={active} />
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
