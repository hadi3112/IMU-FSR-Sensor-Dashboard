/**
 * Diagnostics / validation health-check contract (renderer-side parsing).
 * TODO: Align field names with ESP firmware JSON schema once finalized.
 */

export function buildHealthCheckRequest(requestId, topic) {
  return {
    type: 'stryder_health_check',
    requestId,
    topic,
    issuedAt: Date.now(),
  };
}

/**
 * @param {unknown} parsed
 * @param {string} topic
 * @param {string} requestId
 * @returns {{ ok: boolean; reason?: string; flags?: Record<string, unknown> }}
 */
export function parseHealthAck(parsed, topic, requestId) {
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, reason: 'Payload is not a JSON object' };
  }
  const o = /** @type {Record<string, unknown>} */ (parsed);
  if (o.type !== 'stryder_health_ack') {
    return { ok: false, reason: 'Unexpected message type' };
  }
  if (o.requestId !== requestId) {
    return { ok: false, reason: 'requestId mismatch' };
  }
  if (o.topic && o.topic !== topic) {
    return { ok: false, reason: 'topic mismatch' };
  }
  if (o.healthy !== true) {
    return { ok: false, reason: 'Device reported unhealthy', flags: /** @type any */ (o.flags) };
  }
  return { ok: true, flags: /** @type any */ (o.flags) };
}
