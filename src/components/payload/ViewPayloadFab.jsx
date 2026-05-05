/**
 * @param {{ onOpen: () => void }} props
 */
export function ViewPayloadFab({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed z-[55] rounded-[40px] border border-[#5ee8dc]/20 bg-gradient-to-b from-[#0d5c5e] to-[#062a2c] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_6px_16px_rgba(0,0,0,0.28),0_3px_10px_rgba(255,255,255,0.06)] ring-1 ring-white/10 transition hover:brightness-110 active:scale-[0.98]"
      style={{
        bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
        right: 'max(1.25rem, env(safe-area-inset-right, 0px))',
      }}
    >
      View payload
    </button>
  );
}
