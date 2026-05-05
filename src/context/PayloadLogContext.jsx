import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/** @typedef {{ id: string; topic: string; payload: Record<string, unknown>; ts: number }} PayloadRow */

const PayloadLogContext = createContext(null);

export function PayloadLogProvider({ children }) {
  const [rows, setRows] = useState(/** @type {PayloadRow[]} */ ([]));

  const append = useCallback((topic, payload) => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    setRows((prev) => [{ id, topic, payload, ts: Date.now() }, ...prev].slice(0, 48));
  }, []);

  const clear = useCallback(() => setRows([]), []);

  const value = useMemo(() => ({ rows, append, clear }), [append, clear, rows]);

  return <PayloadLogContext.Provider value={value}>{children}</PayloadLogContext.Provider>;
}

export function usePayloadLog() {
  const ctx = useContext(PayloadLogContext);
  if (!ctx) {
    throw new Error('usePayloadLog requires PayloadLogProvider');
  }
  return ctx;
}
