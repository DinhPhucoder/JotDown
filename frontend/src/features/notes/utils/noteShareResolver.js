// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePermission(value) {
  return value === 'edit' ? 'edit' : 'read';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolves sharing metadata for a note relative to a given user.
 *
 * @param {object} note
 * @param {string} currentUserEmail
 * @returns {{ ownerEmail, ownerName, isOwnedByMe, isOwnedShared, isReceivedShared, myPermission }}
 */
export function resolveNoteShareMeta(note, currentUserEmail) {
  const ownerEmail = normalizeEmail(note.ownerEmail || note.createdByEmail || note.authorEmail);
  const ownerName = String(note.ownerName || note.authorName || '').trim();
  const normalizedCurrentEmail = normalizeEmail(currentUserEmail);
  const normalizedSharedWith = Array.isArray(note.sharedWith)
    ? note.sharedWith.map((entry) => ({
        email: normalizeEmail(typeof entry === 'string' ? entry : entry?.email),
        permission: normalizePermission(typeof entry === 'string' ? 'read' : entry?.permission),
      }))
    : [];

  const mySharedEntry = normalizedSharedWith.find((entry) => entry.email === normalizedCurrentEmail);
  const fallbackPermission = normalizePermission(
    note.accessPermission || note.viewerPermission || note.permission,
  );
  const isOwnedByMe = !ownerEmail || ownerEmail === normalizedCurrentEmail;
  const isOwnedShared = isOwnedByMe && normalizedSharedWith.length > 0;
  const isReceivedShared = !isOwnedByMe && (Boolean(mySharedEntry) || Boolean(note.accessPermission));

  return {
    ownerEmail,
    ownerName,
    isOwnedByMe,
    isOwnedShared,
    isReceivedShared,
    myPermission: mySharedEntry?.permission || fallbackPermission,
  };
}
