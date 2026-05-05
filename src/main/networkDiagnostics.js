import { execFile } from 'node:child_process';
import net from 'node:net';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const REQUIRED_SSID = 'Galaxy_A12';

/**
 * Best-effort current Wi‑Fi SSID for pre-session validation.
 * TODO: Implement robust SSID detection on macOS (CoreWLAN / airport CLI) and Linux (nmcli / iw).
 * @returns {Promise<{ ssid: string | null; raw?: string; platform: string }>}
 */
export async function getCurrentWifiSsid() {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      const { stdout } = await execFileAsync('netsh', ['wlan', 'show', 'interfaces'], {
        windowsHide: true,
        timeout: 8000,
      });
      const match = stdout.match(/SSID\s*:\s*(.+)/i);
      const ssid = match?.[1]?.trim() ?? null;
      return { ssid: ssid && ssid !== '' ? ssid : null, raw: stdout, platform };
    }
    // TODO: darwin — parse `/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I` or CoreWLAN native addon
    // TODO: linux — `nmcli -t -f active,ssid dev wifi | egrep '^yes'` etc.
    return { ssid: null, raw: 'SSID detection not implemented on this platform', platform };
  } catch (e) {
    return {
      ssid: null,
      raw: e instanceof Error ? e.message : String(e),
      platform,
    };
  }
}

export function isRequiredSsid(ssid) {
  if (!ssid) return false;
  return ssid.trim() === REQUIRED_SSID;
}

export { REQUIRED_SSID };

/**
 * Lightweight TCP reachability probe (not ICMP ping) for broker host:port.
 * @param {{ host: string; port: number; timeoutMs?: number }} opts
 */
export function testTcpReachable(opts) {
  const { host, port, timeoutMs = 4000 } = opts;
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = net.createConnection({ host, port }, () => {
      const latencyMs = Date.now() - started;
      socket.destroy();
      resolve({ ok: true, latencyMs });
    });
    socket.setTimeout(timeoutMs);
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
    socket.on('error', (err) => {
      resolve({ ok: false, error: err instanceof Error ? err.message : String(err) });
    });
  });
}
