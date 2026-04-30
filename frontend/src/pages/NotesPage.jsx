import { useEffect, useState, useDeferredValue } from 'react';
import { Button, Modal, Offcanvas } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faStickyNote } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import NoteCard from '../features/notes/components/NoteCard';
import NoteEditorModal from '../features/notes/components/NoteEditorModal';
import NoteSettingsModal from '../features/notes/components/NoteSettingsModal';
import UserProfileModal from '../features/profile/components/UserProfileModal';
import NotesHeader from '../features/notes/components/NotesHeader';
import NotesSidebar from '../features/notes/components/NotesSidebar';
import { loadNoteWorkspace, saveNoteWorkspace } from '../data/noteWorkspace';
import { useTheme } from '../hooks/useTheme';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { resolveNoteShareMeta } from '../features/notes/utils/noteShareResolver';
import { sortNotes } from '../features/notes/utils/noteSorter';
import NoteGrid from '../components/common/NoteGrid';
import AnimatedNoteCard from '../components/common/AnimatedNoteCard';
import {
  attachLabelsToNoteOnServer,
  createNoteOnServer,
  deleteNoteOnServer,
  detachLabelsFromNoteOnServer,
  fetchNotes,
  pullSyncChanges,
  pushSyncChanges,
  updateNoteOnServer,
} from '../features/notes/services/noteApiService';
import {
  createLabel,
  deleteLabel,
  fetchLabels as fetchLabelsFromServer,
  updateLabel,
} from '../features/notes/services/labelApiService';
import {
  cacheNotes,
  clearQueuedSyncChanges,
  enqueueSyncChange,
  getCachedNotes,
  getLastSyncCursor,
  getQueuedSyncChanges,
  setLastSyncCursor,
  upsertCachedNote,
} from '../services/noteOfflineSync';
import { subscribeToNoteChannel } from '../services/noteRealtime';
import '../features/notes/styles/index.css';

const DEFAULT_NOTE_PREFERENCES = {
  fontSize: 'medium',
  defaultNoteColor: 'default',
};

function resolveNoteFontSize(value) {
  return value === 'small' || value === 'large' ? value : 'medium';
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isServerBackedId(noteId) {
  return /^\d+$/.test(String(noteId || ''));
}

const NOTE_COLOR_TO_HEX = {
  default: '#ffffff',
  yellow: '#fde68a',
  green: '#bbf7d0',
  blue: '#bfdbfe',
  pink: '#fbcfe8',
  purple: '#ddd6fe',
  orange: '#fed7aa',
  teal: '#99f6e4',
};

function resolveApiColor(color) {
  if (typeof color === 'string' && /^#[0-9A-F]{6}$/i.test(color)) {
    return color;
  }

  return NOTE_COLOR_TO_HEX[color] || '#ffffff';
}

function toSyncPayload(note) {
  return {
    title: String(note?.title || ''),
    content: String(note?.content || ''),
    color: resolveApiColor(note?.color),
    is_pinned: Boolean(note?.isPinned),
    version: Math.max(Number(note?.version || 1), 1),
  };
}

function normalizeLabelNames(list) {
  const seen = new Set();

  return (Array.isArray(list) ? list : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function NotesPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isOffline = useOnlineStatus();
  const [initialWorkspace] = useState(() => loadNoteWorkspace());
  const [notes, setNotes] = useState(() => {
    // Nếu có token, ưu tiên bắt đầu với mảng rỗng để đợi dữ liệu từ server,
    // tránh hiện tượng flash dữ liệu cũ từ localStorage.
    if (localStorage.getItem('auth_token')) {
      return [];
    }
    return sortNotes(initialWorkspace.notes);
  });
  const [labels, setLabels] = useState(() => initialWorkspace.labels);
  const [user, setUser] = useState(() => {
    // Lấy user từ backend (đã lưu khi login)
    try {
      const authUser = JSON.parse(localStorage.getItem('auth_user'));
      if (authUser) {
        return {
          ...initialWorkspace.user,
          id: authUser.id,
          email: authUser.email,
          displayName: authUser.name,
          avatar: authUser.avatar,
          isVerified: authUser.email_verified || false,
          preferences: authUser.preferences || initialWorkspace.user.preferences,
        };
      }
    } catch { /* ignore */ }
    return initialWorkspace.user;
  });
  const [viewMode, setViewMode] = useState(() => initialWorkspace.viewMode);
  const [search, setSearch] = useState('');

  const resolvedNotePreferences = {
    ...DEFAULT_NOTE_PREFERENCES,
    ...(user?.preferences || {}),
  };
  const deferredSearch = useDeferredValue(search);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [showShared, setShowShared] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [unlockingNote, setUnlockingNote] = useState(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  useEffect(() => {
    saveNoteWorkspace({ notes, labels, user, viewMode });
  }, [notes, labels, user, viewMode]);

  useEffect(() => {
    // Refresh user data from backend on mount to get latest verification status
    import('../features/auth/services/authService').then(m => {
      m.getUser().then(res => {
        if (res.data?.user) {
          localStorage.setItem('auth_user', JSON.stringify(res.data.user));
          setUser(prev => ({
            ...prev,
            ...res.data.user,
            isVerified: res.data.user.email_verified || false,
            displayName: res.data.user.name,
          }));
        }
      }).catch(() => {});
    });

    // Listen to storage event to sync cross-tab (like when they verify in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'auth_user' && e.newValue) {
        try {
          const authUser = JSON.parse(e.newValue);
          setUser(prev => ({
            ...prev,
            isVerified: authUser.email_verified || false,
          }));
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      return;
    }

    let isCancelled = false;

    async function loadInitialNotes() {
      if (isOffline) {
        const cached = await getCachedNotes();

        if (!isCancelled && cached.length > 0) {
          setNotes(sortNotes(cached));
        }

        return;
      }

      try {
        const remoteNotes = await fetchNotes();

        if (isCancelled) {
          return;
        }

        setNotes(sortNotes(remoteNotes));
        await cacheNotes(remoteNotes);
        await setLastSyncCursor(new Date().toISOString());

        try {
          const remoteLabels = await fetchLabelsFromServer();
          if (!isCancelled) {
            setLabels(remoteLabels);
          }
        } catch {
          // no-op: keep local labels when label fetch fails
        }
      } catch {
        const cached = await getCachedNotes();

        if (!isCancelled && cached.length > 0) {
          setNotes(sortNotes(cached));
        }
      }
    }

    void loadInitialNotes();

    return () => {
      isCancelled = true;
    };
  }, [isOffline]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token || isOffline) {
      return;
    }

    let isCancelled = false;

    async function flushAndPullChanges() {
      const queuedChanges = await getQueuedSyncChanges();

      if (queuedChanges.length > 0) {
        const changes = queuedChanges.map((entry) => ({
          action: entry.action,
          entity_id: entry.entity_id,
          payload: entry.payload,
          timestamp: entry.timestamp,
        }));

        try {
          const syncResult = await pushSyncChanges(changes);

          if (!isCancelled && Array.isArray(syncResult.conflicts) && syncResult.conflicts.length > 0) {
            setNotes((currentNotes) => {
              const conflictMap = new Map(
                syncResult.conflicts
                  .filter((item) => item?.server_note?.id !== undefined)
                  .map((item) => [String(item.server_note.id), {
                    ...item.server_note,
                    id: String(item.server_note.id),
                    isPinned: Boolean(item.server_note.is_pinned),
                    pinnedAt: item.server_note.pinned_at || undefined,
                    createdAt: item.server_note.created_at || new Date().toISOString(),
                    updatedAt: item.server_note.updated_at || new Date().toISOString(),
                    version: Number(item.server_note.version || 1),
                    labels: [],
                    attachments: Array.isArray(item.server_note.attachments) ? item.server_note.attachments : [],
                    images: Array.isArray(item.server_note.attachments)
                      ? item.server_note.attachments.map((attachment) => String(attachment?.file_url || '')).filter(Boolean)
                      : [],
                    sharedWith: [],
                    isLocked: Boolean(item.server_note.is_protected),
                    lockPassword: '',
                  }]),
              );

              return sortNotes(
                currentNotes.map((note) => conflictMap.get(String(note.id)) || note),
              );
            });
          }

          await clearQueuedSyncChanges();
        } catch {
          return;
        }
      }

      try {
        const since = await getLastSyncCursor();
        const pulled = await pullSyncChanges(since);

        if (isCancelled) {
          return;
        }

        setNotes((currentNotes) => {
          const nextMap = new Map(currentNotes.map((note) => [String(note.id), note]));

          pulled.notes.forEach((note) => {
            nextMap.set(String(note.id), note);
          });

          pulled.deletedIds.forEach((id) => {
            nextMap.delete(String(id));
          });

          const merged = Array.from(nextMap.values());
          void cacheNotes(merged);
          return sortNotes(merged);
        });

        await setLastSyncCursor(pulled.syncedAt);
      } catch {
        // no-op: preserve local state when sync fails
      }
    }

    void flushAndPullChanges();

    return () => {
      isCancelled = true;
    };
  }, [isOffline]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token || isOffline || notes.length === 0) {
      return;
    }

    const unsubscribers = [];
    const subscribed = new Set();

    notes.forEach((note) => {
      if (!isServerBackedId(note.id) || subscribed.has(String(note.id))) {
        return;
      }

      subscribed.add(String(note.id));

      void subscribeToNoteChannel(note.id, (payload) => {
        const remote = payload?.note;

        if (!remote || remote.id === undefined) {
          return;
        }

        const normalized = {
          ...note,
          id: String(remote.id),
          title: String(remote.title || ''),
          content: String(remote.content || ''),
          color: remote.color || note.color,
          isPinned: Boolean(remote.is_pinned),
          pinnedAt: remote.pinned_at || undefined,
          updatedAt: remote.updated_at || new Date().toISOString(),
          version: Number(remote.version || note.version || 1),
          attachments: Array.isArray(remote.attachments) ? remote.attachments : [],
          images: Array.isArray(remote.attachments)
            ? remote.attachments.map((attachment) => String(attachment?.file_url || '')).filter(Boolean)
            : note.images,
        };

        setNotes((currentNotes) =>
          sortNotes(
            currentNotes.map((currentNote) =>
              String(currentNote.id) === String(normalized.id) ? normalized : currentNote,
            ),
          ),
        );
        void upsertCachedNote(normalized);
      }).then((unsubscribe) => {
        unsubscribers.push(unsubscribe);
      });
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [isOffline, notes]);

  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const normalizedUserEmail = normalizeEmail(user.email);

  const filteredNotes = sortNotes(
    notes
      .map((note) => ({
        ...note,
        __shareMeta: resolveNoteShareMeta(note, normalizedUserEmail),
      }))
      .filter((note) => {
        if (showShared && !note.__shareMeta.isOwnedShared && !note.__shareMeta.isReceivedShared) {
          return false;
        }

        if (selectedLabels.length > 0 && !selectedLabels.some((label) => note.labels.includes(label))) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return `${note.title} ${note.content}`.toLowerCase().includes(normalizedSearch);
      }),
  );

  const pinnedNotes = filteredNotes.filter((note) => note.isPinned);
  const otherNotes = filteredNotes.filter((note) => !note.isPinned);
  const ownedSharedNotes = filteredNotes.filter((note) => note.__shareMeta?.isOwnedShared);
  const receivedSharedNotes = filteredNotes.filter((note) => note.__shareMeta?.isReceivedShared);
  const noteFontSize = resolveNoteFontSize(user?.preferences?.fontSize);

  function renderNote(note) {
    return (
      <AnimatedNoteCard
        key={note.id}
        note={note}
        viewMode={viewMode}
        onOpen={openEditor}
        onTogglePin={handleToggleNotePin}
        isOffline={isOffline}
        shareScope={
          note.__shareMeta?.isReceivedShared ? 'received'
            : note.__shareMeta?.isOwnedShared ? 'owned'
              : null
        }
        accessPermission={note.__shareMeta?.isReceivedShared ? note.__shareMeta.myPermission : null}
      />
    );
  }

  function openEditor(note = null) {
    const requiredPassword = String(note?.lockPassword || '').trim();

    if (note?.isLocked && requiredPassword.length > 0) {
      setUnlockingNote(note);
      setUnlockPassword('');
      setUnlockError('');
      return;
    }

    setEditingNote(note);
    setEditorOpen(true);
  }

  function handleCancelUnlock() {
    setUnlockingNote(null);
    setUnlockPassword('');
    setUnlockError('');
  }

  function handleConfirmUnlock() {
    if (!unlockingNote) {
      return;
    }

    const expectedPassword = String(unlockingNote.lockPassword || '').trim();

    if (expectedPassword.length > 0 && unlockPassword.trim() !== expectedPassword) {
      setUnlockError('Mật khẩu không đúng.');
      return;
    }

    setEditingNote(unlockingNote);
    setEditorOpen(true);
    handleCancelUnlock();
  }

  function handleSave(nextNote) {
    const now = new Date().toISOString();
    let noteWithVersion = {
      ...nextNote,
      labels: normalizeLabelNames(nextNote?.labels),
      version: Math.max(Number(nextNote?.version || 1), 1),
      updatedAt: nextNote?.updatedAt || now,
    };
    let previousLabels = [];

    setNotes((currentNotes) => {
      const index = currentNotes.findIndex((item) => item.id === nextNote.id);

      if (index === -1) {
        return sortNotes([noteWithVersion, ...currentNotes]);
      }

      const currentVersion = Math.max(Number(currentNotes[index]?.version || 1), 1);
      previousLabels = normalizeLabelNames(currentNotes[index]?.labels);
      noteWithVersion = {
        ...noteWithVersion,
        version: Math.max(currentVersion, Number(noteWithVersion.version || 1)),
      };

      const nextNotes = [...currentNotes];
      nextNotes[index] = noteWithVersion;
      return sortNotes(nextNotes);
    });

    void upsertCachedNote(noteWithVersion);

    const token = localStorage.getItem('auth_token');

    if (!token) {
      return;
    }

    async function syncNoteLabels(noteId) {
      const nextLabelNames = normalizeLabelNames(noteWithVersion.labels);
      const previousLabelSet = new Set(previousLabels.map((name) => name.toLowerCase()));
      const nextLabelSet = new Set(nextLabelNames.map((name) => name.toLowerCase()));
      const labelNameToId = new Map(
        labels
          .filter((label) => /^\d+$/.test(String(label?.id || '')))
          .map((label) => [String(label?.name || '').trim().toLowerCase(), Number(label.id)]),
      );

      const attachedIds = nextLabelNames
        .filter((name) => !previousLabelSet.has(name.toLowerCase()))
        .map((name) => labelNameToId.get(name.toLowerCase()))
        .filter((id) => Number.isInteger(id) && id > 0);

      const detachedIds = previousLabels
        .filter((name) => !nextLabelSet.has(name.toLowerCase()))
        .map((name) => labelNameToId.get(name.toLowerCase()))
        .filter((id) => Number.isInteger(id) && id > 0);

      if (attachedIds.length > 0) {
        await attachLabelsToNoteOnServer(noteId, attachedIds);
      }

      if (detachedIds.length > 0) {
        await detachLabelsFromNoteOnServer(noteId, detachedIds);
      }
    }

    if (isOffline) {
      void enqueueSyncChange({
        action: isServerBackedId(noteWithVersion.id) ? 'UPDATE' : 'CREATE',
        entity_id: String(noteWithVersion.id),
        payload: toSyncPayload(noteWithVersion),
        timestamp: now,
      });
      return;
    }

    if (!isServerBackedId(noteWithVersion.id)) {
      void createNoteOnServer(noteWithVersion)
        .then((createdNote) => {
          return syncNoteLabels(createdNote.id)
            .then(() => {
              const mergedCreatedNote = {
                ...createdNote,
                labels: noteWithVersion.labels,
              };

              setNotes((currentNotes) =>
                sortNotes(
                  currentNotes.map((note) =>
                    note.id === noteWithVersion.id ? mergedCreatedNote : note,
                  ),
                ),
              );
              setEditingNote((currentEditing) =>
                currentEditing?.id === noteWithVersion.id ? mergedCreatedNote : currentEditing,
              );
              return upsertCachedNote(mergedCreatedNote);
            });
        })
        .catch(() => {
          void enqueueSyncChange({
            action: 'CREATE',
            entity_id: String(noteWithVersion.id),
            payload: toSyncPayload(noteWithVersion),
            timestamp: now,
          });
        });
      return;
    }

    void updateNoteOnServer(noteWithVersion.id, noteWithVersion)
      .then((updatedNote) => {
        return syncNoteLabels(noteWithVersion.id)
          .then(() => {
            const mergedUpdatedNote = {
              ...updatedNote,
              labels: noteWithVersion.labels,
            };

            setNotes((currentNotes) =>
              sortNotes(
                currentNotes.map((note) =>
                  note.id === noteWithVersion.id ? mergedUpdatedNote : note,
                ),
              ),
            );
            return upsertCachedNote(mergedUpdatedNote);
          });
      })
      .catch((error) => {
        if (error?.code === 'CONFLICT' && error?.serverNote) {
          setNotes((currentNotes) =>
            sortNotes(
              currentNotes.map((note) =>
                note.id === noteWithVersion.id ? error.serverNote : note,
              ),
            ),
          );

          const shouldKeepLocal = window.confirm(
            'Ghi chu nay da duoc cap nhat boi nguoi khac. Chon OK de giu ban sua cua ban va dong bo lai sau.',
          );

          if (shouldKeepLocal) {
            void enqueueSyncChange({
              action: 'UPDATE',
              entity_id: String(error.serverNote.id),
              payload: {
                ...toSyncPayload(noteWithVersion),
                version: Number(error.serverNote.version || 1),
              },
              timestamp: new Date().toISOString(),
            });
          }

          return;
        }

        void enqueueSyncChange({
          action: 'UPDATE',
          entity_id: String(noteWithVersion.id),
          payload: toSyncPayload(noteWithVersion),
          timestamp: now,
        });
      });
  }

  function handleDelete(noteId) {
    setNotes((currentNotes) => {
      const nextNotes = currentNotes.filter((item) => item.id !== noteId);
      void cacheNotes(nextNotes);
      return nextNotes;
    });
    setEditingNote(null);
    setEditorOpen(false);

    const token = localStorage.getItem('auth_token');

    if (!token) {
      return;
    }

    if (isOffline || !isServerBackedId(noteId)) {
      void enqueueSyncChange({
        action: 'DELETE',
        entity_id: String(noteId),
        payload: null,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    void deleteNoteOnServer(noteId).catch(() => {
      void enqueueSyncChange({
        action: 'DELETE',
        entity_id: String(noteId),
        payload: null,
        timestamp: new Date().toISOString(),
      });
    });
  }

  function handleToggleNotePin(noteId) {
    const now = new Date().toISOString();
    let toggledNote = null;

    setNotes((currentNotes) => {
      const nextNotes = currentNotes.map((note) => {
        if (note.id !== noteId) {
          return note;
        }

        toggledNote = {
          ...note,
          isPinned: !note.isPinned,
          pinnedAt: !note.isPinned ? now : undefined,
          updatedAt: now,
          version: Math.max(Number(note.version || 1), 1),
        };

        return toggledNote;
      });

      return sortNotes(nextNotes);
    });

    if (!toggledNote) {
      return;
    }

    void upsertCachedNote(toggledNote);

    const token = localStorage.getItem('auth_token');

    if (!token) {
      return;
    }

    if (isOffline || !isServerBackedId(toggledNote.id)) {
      void enqueueSyncChange({
        action: isServerBackedId(toggledNote.id) ? 'UPDATE' : 'CREATE',
        entity_id: String(toggledNote.id),
        payload: toSyncPayload(toggledNote),
        timestamp: now,
      });
      return;
    }

    void updateNoteOnServer(toggledNote.id, toggledNote).catch(() => {
      void enqueueSyncChange({
        action: 'UPDATE',
        entity_id: String(toggledNote.id),
        payload: toSyncPayload(toggledNote),
        timestamp: now,
      });
    });
  }

  function handleToggleLabel(labelName) {
    setSelectedLabels((currentLabels) =>
      currentLabels.includes(labelName)
        ? []
        : [labelName],
    );
    setShowShared(false);
  }

  function handleAddLabel(labelName) {
    const normalizedName = String(labelName || '').trim();
    if (!normalizedName) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (token && !isOffline) {
      void createLabel(normalizedName)
        .then((created) => {
          setLabels((currentLabels) => {
            if (currentLabels.some((label) => String(label.id) === String(created.id))) {
              return currentLabels;
            }
            return [...currentLabels, created];
          });
        })
        .catch(() => {
          setLabels((currentLabels) => {
            const normalizedKey = normalizedName.toLowerCase();
            if (currentLabels.some((label) => label.name.trim().toLowerCase() === normalizedKey)) {
              return currentLabels;
            }
            return [...currentLabels, { id: crypto.randomUUID(), name: normalizedName }];
          });
        });
      return;
    }

    setLabels((currentLabels) => {
      const normalizedKey = normalizedName.toLowerCase();
      if (currentLabels.some((label) => label.name.trim().toLowerCase() === normalizedKey)) {
        return currentLabels;
      }
      return [...currentLabels, { id: crypto.randomUUID(), name: normalizedName }];
    });
  }

  function handleRenameLabel(labelId, nextName) {
    const currentLabel = labels.find((label) => label.id === labelId);

    if (!currentLabel) {
      return;
    }

    const normalizedNextName = String(nextName || '').trim();
    if (!normalizedNextName) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (token && !isOffline) {
      void updateLabel(labelId, normalizedNextName).catch(() => {
        // no-op: keep optimistic UI even if request fails
      });
    }

    setLabels((currentLabels) =>
      currentLabels.map((label) => (label.id === labelId ? { ...label, name: normalizedNextName } : label)),
    );
    setSelectedLabels((currentLabels) =>
      currentLabels.map((labelName) => (labelName === currentLabel.name ? normalizedNextName : labelName)),
    );
    setNotes((currentNotes) =>
      currentNotes.map((note) => ({
        ...note,
        labels: note.labels.map((labelName) => (labelName === currentLabel.name ? normalizedNextName : labelName)),
      })),
    );
  }

  function handleDeleteLabel(labelId) {
    const label = labels.find((item) => item.id === labelId);

    setLabels((currentLabels) => currentLabels.filter((item) => item.id !== labelId));

    if (!label) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (token && !isOffline) {
      void deleteLabel(labelId).catch(() => {
        // no-op: preserve UI even if request fails
      });
    }

    setSelectedLabels((currentLabels) => currentLabels.filter((item) => item !== label.name));
    setNotes((currentNotes) =>
      currentNotes.map((note) => ({
        ...note,
        labels: note.labels.filter((item) => item !== label.name),
      })),
    );
  }

  function handleUpdateProfilePreferences(nextPreferences) {
    const nextDefaultColor = String(nextPreferences?.defaultNoteColor || '').trim();
    const shouldSyncAllNoteColors =
      nextDefaultColor.length > 0 && nextDefaultColor !== resolvedNotePreferences.defaultNoteColor;

    const newPreferences = {
      ...resolvedNotePreferences,
      ...nextPreferences,
      fontSize: resolveNoteFontSize(nextPreferences?.fontSize),
    };

    setUser((currentUser) => ({
      ...currentUser,
      preferences: newPreferences,
    }));

    import('../features/auth/services/authService').then(m => m.updatePreferences(newPreferences)).catch(() => {});

    if (!shouldSyncAllNoteColors) {
      return;
    }

    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.color === nextDefaultColor
          ? note
          : {
            ...note,
            color: nextDefaultColor,
          },
      ),
    );
  }

  function handleOpenLogoutConfirm() {
    setLogoutConfirmOpen(true);
  }

  function handleCloseLogoutConfirm() {
    setLogoutConfirmOpen(false);
  }

  function handleConfirmLogout() {
    setLogoutConfirmOpen(false);
    // Gọi API logout (fire-and-forget) và xóa dữ liệu local
    import('../features/auth/services/authService').then(m => m.logout()).catch(() => { });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/login');
  }

  return (
    <div className={`notes-shell note-font-${noteFontSize}`}>
      <NotesHeader
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        userName={user.displayName}
        userAvatar={user.avatar}
        isVerified={user.isVerified}
        selectedLabel={selectedLabels.length > 0 ? selectedLabels[0] : null}
        onLogout={handleOpenLogoutConfirm}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        onToggleDesktopSidebar={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
      />

      <div className="container-fluid notes-main">
        <div className="row g-4 flex-nowrap overflow-hidden">
          <aside className={`col-lg-3 col-xl-3 col-xxl-2 d-none d-lg-block notes-sidebar-aside ${!desktopSidebarOpen ? 'collapsed' : ''}`}>
            <div className="notes-panel position-sticky top-0">
              <NotesSidebar
                labels={labels}
                selectedLabels={selectedLabels}
                onToggleLabel={handleToggleLabel}
                onAddLabel={handleAddLabel}
                onRenameLabel={handleRenameLabel}
                onDeleteLabel={handleDeleteLabel}
                showShared={showShared}
                onToggleShared={() => {
                  setShowShared((currentValue) => !currentValue);
                  setSelectedLabels([]);
                }}
                onShowAll={() => {
                  setSelectedLabels([]);
                  setShowShared(false);
                }}
              />
            </div>
          </aside>

          <div className="col flex-grow-1 notes-content-area">
            {filteredNotes.length > 0 ? (
              <>
                {showShared ? (
                  <>
                    <section className="notes-shared-space">
                      <div className="notes-shared-space__header">
                        <div className="notes-shared-space__title">Ghi chú của tôi</div>
                      </div>
                      <NoteGrid items={ownedSharedNotes} viewMode={viewMode} renderItem={renderNote} emptyMessage="Không có ghi chú trong khu vực này." />
                    </section>
                    <section className="notes-shared-space">
                      <div className="notes-shared-space__header">
                        <div className="notes-shared-space__title">Ghi chú được chia sẻ</div>
                      </div>
                      <NoteGrid items={receivedSharedNotes} viewMode={viewMode} renderItem={renderNote} emptyMessage="Không có ghi chú trong khu vực này." />
                    </section>
                  </>
                ) : (
                  <>
                    <NoteGrid items={pinnedNotes} viewMode={viewMode} title={pinnedNotes.length > 0 ? 'Đã ghim' : ''} renderItem={renderNote} />
                    <NoteGrid items={otherNotes} viewMode={viewMode} title={pinnedNotes.length > 0 ? 'Khác' : ''} renderItem={renderNote} />
                  </>
                )}
              </>
            ) : (
              <div className="notes-panel notes-empty-state">
                <div className="notes-empty-state__icon">
                  <FontAwesomeIcon icon={faStickyNote} />
                </div>
                <h2 className="h4">Chưa có ghi chú phù hợp</h2>
                <p className="text-secondary mb-4">
                  Thử xóa bộ lọc hiện tại hoặc tạo ghi chú mới để bắt đầu kho ghi chú của bạn.
                </p>
                <Button variant="primary" onClick={() => openEditor(null)}>
                  Tạo ghi chú đầu tiên
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button className="note-fab" onClick={() => openEditor(null)} aria-label="Tạo ghi chú mới">
        <FontAwesomeIcon icon={faPlus} />
      </Button>

      <Offcanvas
        show={mobileSidebarOpen}
        onHide={() => setMobileSidebarOpen(false)}
        placement="start"
        className="notes-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Bộ lọc ghi chú</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <NotesSidebar
            labels={labels}
            selectedLabels={selectedLabels}
            onToggleLabel={(labelName) => {
              handleToggleLabel(labelName);
              setMobileSidebarOpen(false);
            }}
            onAddLabel={handleAddLabel}
            onRenameLabel={handleRenameLabel}
            onDeleteLabel={handleDeleteLabel}
            showShared={showShared}
            onToggleShared={() => {
              setShowShared((currentValue) => !currentValue);
              setSelectedLabels([]);
              setMobileSidebarOpen(false);
            }}
            onShowAll={() => {
              setSelectedLabels([]);
              setShowShared(false);
              setMobileSidebarOpen(false);
            }}
          />
        </Offcanvas.Body>
      </Offcanvas>

      {editorOpen ? (
        <NoteEditorModal
          key={`${editingNote?.id || 'new'}-${resolvedNotePreferences.defaultNoteColor}`}
          note={editingNote}
          open={editorOpen}
          defaultColor={resolvedNotePreferences.defaultNoteColor}
          isOffline={isOffline}
          availableLabels={labels.map((label) => label.name)}
          onClose={() => setEditorOpen(false)}
          onDelete={handleDelete}
          onSave={handleSave}
        />
      ) : null}

      <NoteSettingsModal
        open={settingsOpen}
        preferences={resolvedNotePreferences}
        onClose={() => setSettingsOpen(false)}
        onUpdate={(nextPreferences) => {
          setUser((currentUser) => ({
            ...currentUser,
            preferences: {
              ...(currentUser?.preferences || DEFAULT_NOTE_PREFERENCES),
              ...(nextPreferences || {}),
              fontSize: resolveNoteFontSize(nextPreferences?.fontSize),
            },
          }));
          import('../features/auth/services/authService').then(m => m.updatePreferences(nextPreferences)).catch(() => {});
        }}
      />

      <UserProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        theme={theme}
        onToggleTheme={setTheme}
        preferences={resolvedNotePreferences}
        onUpdatePreferences={handleUpdateProfilePreferences}
        user={user}
        onUserUpdate={(updates) => setUser(prev => ({ ...prev, ...updates }))}
      />

      <Modal show={Boolean(unlockingNote)} onHide={handleCancelUnlock} centered dialogClassName="note-lock-modal">
        <Modal.Header className="border-0">
          <Modal.Title>Nhập mật khẩu để mở ghi chú</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <input
            type="password"
            className="note-editor__panel-input"
            placeholder="Mật khẩu ghi chú"
            value={unlockPassword}
            onChange={(event) => {
              setUnlockPassword(event.target.value);
              setUnlockError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleConfirmUnlock();
              }
            }}
          />
          {unlockError ? <div className="note-editor__lock-error">{unlockError}</div> : null}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={handleCancelUnlock}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmUnlock}>
            Mở ghi chú
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={logoutConfirmOpen} onHide={handleCloseLogoutConfirm} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Xác nhận đăng xuất</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          Bạn có chắc muốn đăng xuất khỏi phiên làm việc hiện tại không?
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={handleCloseLogoutConfirm}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmLogout}>
            Đăng xuất
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default NotesPage;
