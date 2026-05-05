import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useSession } from '../../context/SessionContext.jsx';

const tabs = [
  { id: 'devices', label: 'Devices' },
  { id: 'stats', label: 'Stats' },
  { id: 'profile', label: 'Profile' },
];

export function TabBar() {
  const { activeTab, setActiveTab } = useSession();
  const navRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const btnRefs = useRef(/** @type {(HTMLButtonElement | null)[]} */ ([]));
  const [pill, setPill] = useState({ left: 4, width: 0 });

  const idx = Math.max(0, tabs.findIndex((t) => t.id === activeTab));

  const measure = useCallback(() => {
    const nav = navRef.current;
    const btn = btnRefs.current[idx];
    if (!nav || !btn) return;
    const nr = nav.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setPill({
      left: br.left - nr.left,
      width: br.width,
    });
  }, [idx]);

  useLayoutEffect(() => {
    measure();
  }, [measure, activeTab]);

  useLayoutEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return (
    <nav className="flex shrink-0 justify-center px-3 pb-2 pt-1">
      <div className="w-[70%] min-w-[220px] max-w-md">
        <div
          ref={navRef}
          className="relative flex rounded-[40px] bg-[#141416]/90 p-1.5 shadow-inner ring-1 ring-white/10 backdrop-blur-sm"
        >
          <div
            className="pointer-events-none absolute rounded-[36px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-[left,width] duration-300 ease-out"
            style={{
              left: pill.left,
              width: Math.max(pill.width, 0),
              top: 6,
              bottom: 6,
            }}
          />
          {tabs.map((t, i) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  btnRefs.current[i] = el;
                }}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`relative z-10 flex-1 rounded-[36px] py-2.5 text-[11px] font-bold uppercase tracking-wide transition-colors duration-200 ${
                  active ? 'text-black' : 'text-[#9a9aa0] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
