// ─── Label normalizers ─────────────────────────────────────────────────────────

/**
 * Deduplicates and trims label strings.
 *
 * @param {unknown} entries
 * @returns {string[]}
 */
export function normalizeLabels(entries) {
  const seen = new Set();

  return (Array.isArray(entries) ? entries : [])
    .filter(Boolean)
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length > 0)
    .filter((entry) => {
      const key = entry.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

// ─── Share / security normalizers ─────────────────────────────────────────────

/**
 * Normalizes a raw sharedWith array into a consistent shape.
 *
 * @param {unknown} entries
 * @returns {{ id: any, email: string, permission: 'read'|'edit', sharedAt: string, receiver: any }[]}
 */
export function normalizeSharedWith(entries) {
  return (Array.isArray(entries) ? entries : [])
    .filter(Boolean)
    .map((entry) => ({
      id: entry?.id,
      email: String(entry.email || entry.receiver?.email || '').trim().toLowerCase(),
      permission: entry.permission === 'edit' ? 'edit' : 'read',
      sharedAt: String(entry.sharedAt || entry.created_at || new Date().toISOString()),
      receiver: entry?.receiver,
    }))
    .filter((entry) => entry.email.length > 0);
}

/**
 * Enforces the mutual-exclusion invariant:
 * a locked note cannot have collaborators, and vice-versa.
 *
 * @param {boolean} nextLocked
 * @param {string} nextLockPassword
 * @param {unknown} nextSharedWith
 * @returns {{ isLocked: boolean, lockPassword: string, sharedWith: object[] }}
 */
export function normalizeSecurityState(nextLocked, nextLockPassword, nextSharedWith) {
  const normalizedSharedWith = normalizeSharedWith(nextSharedWith);
  const isLocked = Boolean(nextLocked);
  const lockPassword = nextLockPassword ? String(nextLockPassword) : '';

  if (isLocked) {
    return { isLocked: true, lockPassword, sharedWith: [] };
  }

  return { isLocked: false, lockPassword: '', sharedWith: normalizedSharedWith };
}
