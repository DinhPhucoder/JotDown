import { NOTE_WORKSPACE_STORAGE_KEY, NOTE_WORKSPACE_VERSION } from '../data/constants';
import { mockUser, mockLabels, mockNotes } from '../data/mockData';

// ─── Sanitizers ────────────────────────────────────────────────────────────────

function sanitizeNote(note) {
  if (!note || typeof note !== 'object') {
    return null;
  }

  const isLocked = Boolean(note.isLocked);
  const lockPassword = note.lockPassword ? String(note.lockPassword) : '';
  const normalizedSharedWith = Array.isArray(note.sharedWith)
    ? note.sharedWith
        .filter(Boolean)
        .map((entry) => ({
          email: String(entry.email || ''),
          permission: entry.permission === 'edit' ? 'edit' : 'read',
          sharedAt: String(entry.sharedAt || new Date().toISOString()),
        }))
    : [];

  return {
    id: String(note.id || crypto.randomUUID()),
    title: String(note.title || ''),
    content: String(note.content || ''),
    color: typeof note.color === 'string' ? note.color : 'default',
    isPinned: Boolean(note.isPinned),
    pinnedAt: note.pinnedAt ? String(note.pinnedAt) : undefined,
    isLocked,
    lockPassword: isLocked ? lockPassword : '',
    labels: Array.isArray(note.labels) ? note.labels.filter(Boolean).map(String) : [],
    images: Array.isArray(note.images) ? note.images.filter(Boolean).map(String) : [],
    // Mutual exclusive invariant: locked notes cannot be shared.
    sharedWith: isLocked ? [] : normalizedSharedWith,
    ownerEmail: note.ownerEmail ? String(note.ownerEmail).trim().toLowerCase() : undefined,
    ownerName: note.ownerName ? String(note.ownerName) : undefined,
    accessPermission:
      note.accessPermission === 'edit' || note.accessPermission === 'read'
        ? note.accessPermission
        : undefined,
    createdAt: String(note.createdAt || new Date().toISOString()),
    updatedAt: String(note.updatedAt || new Date().toISOString()),
  };
}

function sanitizeUser(user) {
  return {
    ...mockUser,
    ...user,
    preferences: {
      ...mockUser.preferences,
      ...(user?.preferences || {}),
    },
  };
}

// ─── Demo note injection ────────────────────────────────────────────────────────

function ensureSharedDemoNote(notes) {
  return Array.isArray(notes) ? notes.map(sanitizeNote).filter(Boolean) : [];
}

// ─── Default workspace ─────────────────────────────────────────────────────────

function getDefaultWorkspace() {
  return {
    notes: [],
    labels: [],
    user: mockUser,
    viewMode: 'grid',
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Loads the note workspace from localStorage.
 * Falls back to default workspace on missing/corrupt data or version mismatch.
 *
 * @returns {{ notes: object[], labels: object[], user: object, viewMode: string }}
 */
export function loadNoteWorkspace() {
  if (typeof window === 'undefined') {
    return getDefaultWorkspace();
  }

  try {
    const raw = window.localStorage.getItem(NOTE_WORKSPACE_STORAGE_KEY);

    if (!raw) {
      return getDefaultWorkspace();
    }

    const parsed = JSON.parse(raw);

    if (parsed.version !== NOTE_WORKSPACE_VERSION) {
      return getDefaultWorkspace();
    }

    return {
      notes: ensureSharedDemoNote(Array.isArray(parsed.notes) ? parsed.notes : mockNotes),
      labels: Array.isArray(parsed.labels)
        ? parsed.labels
            .filter((label) => label && typeof label === 'object')
            .map((label) => ({
              id: String(label.id || crypto.randomUUID()),
              name: String(label.name || ''),
            }))
        : mockLabels,
      user: sanitizeUser(parsed.user),
      viewMode: parsed.viewMode === 'list' ? 'list' : 'grid',
    };
  } catch {
    return getDefaultWorkspace();
  }
}

/**
 * Persists the note workspace to localStorage.
 *
 * @param {{ notes: object[], labels: object[], user: object, viewMode: string }} workspace
 */
export function saveNoteWorkspace(workspace) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    version: NOTE_WORKSPACE_VERSION,
    notes: workspace.notes,
    labels: workspace.labels,
    user: workspace.user,
    viewMode: workspace.viewMode,
  };

  window.localStorage.setItem(NOTE_WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
}
