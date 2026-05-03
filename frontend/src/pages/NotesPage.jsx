import { useEffect, useRef, useState, useDeferredValue } from 'react';
import { Button, Modal, Offcanvas } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faStickyNote, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import NoteCard from '../features/notes/components/NoteCard';
import NoteEditorModal from '../features/notes/components/NoteEditorModal';
import NoteSettingsModal from '../features/notes/components/NoteSettingsModal';
import UserProfileModal from '../features/profile/components/UserProfileModal';
import NotesHeader from '../features/notes/components/NotesHeader';
import NotesSidebar from '../features/notes/components/NotesSidebar';
import NoteDeleteConfirmDialog from '../features/notes/components/NoteDeleteConfirmDialog';
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
  fetchSharedWithMe,
  pullSyncChanges,
  pushSyncChanges,
  updateNoteOnServer,
  verifyNotePassword,
} from '../features/notes/services/noteApiService';
import {
  getNoteAttachmentSignature,
  saveNoteAttachment,
  uploadImageToCloudinary,
} from '../features/notes/services/noteAttachmentService';
import {
  getOfflineAttachments,
  removeOfflineAttachmentById,
} from '../features/notes/services/offlineAttachmentStore';
import {
  createLabel,
  deleteLabel,
  fetchLabels as fetchLabelsFromServer,
  updateLabel,
} from '../features/notes/services/labelApiService';
import {
  cacheNotes,
  clearQueuedSyncChanges,
  clearQueuedLabelChanges,
  enqueueSyncChange,
  enqueueLabelChange,
  getCachedNotes,
  getLastSyncCursor,
  getQueuedSyncChanges,
  getQueuedLabelChanges,
  purgeStaleQueueEntries,
  setLastSyncCursor,
  upsertCachedNote,
} from '../services/noteOfflineSync';
import { subscribeToNoteChannel, subscribeToUserChannel } from '../services/noteRealtime';
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
  const payload = {
    title: String(note?.title || ''),
    content: String(note?.content || ''),
    color: resolveApiColor(note?.color),
    is_pinned: Boolean(note?.isPinned),
    is_protected: Boolean(note?.isLocked),
    version: Math.max(Number(note?.version || 0), 0),
    // Gửi kèm danh sách tên label để server đồng bộ attach/detach
    label_names: Array.isArray(note?.labels)
      ? note.labels.map((l) => String(l || '').trim()).filter(Boolean)
      : [],
  };

  if (note?.lockPassword && String(note.lockPassword).trim().length > 0) {
    payload.password = String(note.lockPassword).trim();
  }

  return payload;

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
    // tránh hiện tượng flash dữ liệu cũ từ sessionStorage.
    if (sessionStorage.getItem('auth_token')) {
      return [];
    }
    return sortNotes(initialWorkspace.notes);
  });
  const [labels, setLabels] = useState(() => initialWorkspace.labels);
  const [user, setUser] = useState(() => {
    // Lấy user từ backend (đã lưu khi login)
    try {
      const authUser = JSON.parse(sessionStorage.getItem('auth_user'));
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
  const [deleteConfirmNote, setDeleteConfirmNote] = useState(null);
  const [networkNotice, setNetworkNotice] = useState(() =>
    isOffline
      ? {
        variant: 'warning',
        message: 'Bạn đang offline. Dữ liệu sẽ được lưu cục bộ và chờ đồng bộ.',
      }
      : null,
  );
  const wasOfflineRef = useRef(isOffline);
  const reconnectSyncPendingRef = useRef(false);
  const pendingCreatesRef = useRef(new Map());
  const pendingUpdatesRef = useRef(new Map());

  useEffect(() => {
    saveNoteWorkspace({ notes, labels, user, viewMode });
  }, [notes, labels, user, viewMode]);

  useEffect(() => {
    if (isOffline) {
      reconnectSyncPendingRef.current = false;
      setNetworkNotice({
        variant: 'warning',
        message: 'Bạn đang offline. Dữ liệu sẽ được lưu cục bộ và chờ đồng bộ.',
      });
      wasOfflineRef.current = true;
      return;
    }

    if (wasOfflineRef.current) {
      reconnectSyncPendingRef.current = true;
      setNetworkNotice({
        variant: 'info',
        message: 'Bạn đã online trở lại. Hệ thống đang đồng bộ dữ liệu...',
      });
    }

    wasOfflineRef.current = false;
  }, [isOffline]);

  useEffect(() => {
    // Refresh user data from backend on mount to get latest verification status
    import('../features/auth/services/authService').then(m => {
      m.getUser().then(res => {
        if (res.data?.user) {
          sessionStorage.setItem('auth_user', JSON.stringify(res.data.user));
          setUser(prev => ({
            ...prev,
            ...res.data.user,
            isVerified: res.data.user.email_verified || false,
            displayName: res.data.user.name,
          }));
        }
      }).catch(() => { });
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
    const token = sessionStorage.getItem('auth_token');

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
        // Gọi song song cả owned notes và shared-with-me
        const [remoteNotes, sharedRaw] = await Promise.all([
          fetchNotes(),
          fetchSharedWithMe().catch(() => []),
        ]);

        if (isCancelled) return;

        // Normalize shared notes từ NoteShareResource
        const sharedNotes = sharedRaw
          .map((share) => {
            const n = share?.note ?? share;
            if (!n?.id) return null;
            const attachments = Array.isArray(n.attachments) ? n.attachments : [];
            return {
              id: String(n.id),
              title: String(n.title || ''),
              content: String(n.content || ''),
              color: n.color || 'default',
              isPinned: Boolean(n.is_pinned),
              pinnedAt: n.pinned_at || undefined,
              isLocked: Boolean(n.is_protected),
              lockPassword: '',
              labels: Array.isArray(n.labels) ? n.labels.map(l => String(l.name || '')) : [],
              images: attachments.map((a) => String(a?.file_url || '')).filter(Boolean),
              attachments,
              sharedWith: Array.isArray(n.shares)
                ? n.shares.map(s => ({
                  id: s?.id,
                  email: s.receiver?.email,
                  permission: s.permission,
                  receiver: s?.receiver,
                }))
                : [],
              ownerEmail: share?.sender?.email || null,
              ownerName: share?.sender?.name || null,
              ownerAvatar: share?.sender?.avatar || null,
              accessPermission: share?.permission || null,
              createdAt: n.created_at || new Date().toISOString(),
              updatedAt: n.updated_at || new Date().toISOString(),
              version: Number(n.version || 1),
            };
          })
          .filter(Boolean);

        const remoteNotesNormalized = remoteNotes;

        // Gộp, ưu tiên owned notes khi trùng ID
        const ownedIds = new Set(remoteNotesNormalized.map((n) => String(n.id)));
        const merged = [
          ...remoteNotesNormalized,
          ...sharedNotes.filter((n) => !ownedIds.has(String(n.id))),
        ];

        setNotes(sortNotes(merged));
        await cacheNotes(merged);
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
    const token = sessionStorage.getItem('auth_token');

    if (!token || isOffline) {
      return;
    }

    let isCancelled = false;

    async function syncOfflineAttachments() {
      const offlineAttachments = await getOfflineAttachments();

      for (const entry of offlineAttachments) {
        if (isCancelled) {
          return;
        }

        const entryId = String(entry?.id || '');
        const noteId = String(entry?.note_id || '');
        const file = entry?.file;

        if (!entryId || !isServerBackedId(noteId) || !file) {
          continue;
        }

        try {
          const numericNoteId = Number(noteId);
          const signaturePayload = await getNoteAttachmentSignature(numericNoteId);
          const cloudinaryResponse = await uploadImageToCloudinary(file, signaturePayload);
          const savedAttachment = await saveNoteAttachment(numericNoteId, {
            file_url: cloudinaryResponse.secure_url,
            file_size: cloudinaryResponse.bytes,
            file_type: cloudinaryResponse.format,
            original_name: cloudinaryResponse.original_filename,
          });

          if (isCancelled) {
            return;
          }

          setNotes((currentNotes) => {
            let changed = false;

            const nextNotes = currentNotes.map((note) => {
              if (String(note.id) !== noteId) {
                return note;
              }

              const currentAttachments = Array.isArray(note.attachments) ? note.attachments : [];
              const matchingAttachment = currentAttachments.find(
                (attachment) => String(attachment?.local_file_id || attachment?.id || '') === entryId,
              );

              if (matchingAttachment?.file_url?.startsWith('blob:')) {
                URL.revokeObjectURL(matchingAttachment.file_url);
              }

              const nextAttachments = currentAttachments
                .filter((attachment) => String(attachment?.local_file_id || attachment?.id || '') !== entryId)
                .concat(savedAttachment)
                .slice(0, 3);
              const nextImages = nextAttachments
                .map((attachment) => String(attachment?.file_url || ''))
                .filter(Boolean)
                .slice(0, 3);

              changed = true;

              return {
                ...note,
                attachments: nextAttachments,
                images: nextImages,
                updatedAt: new Date().toISOString(),
              };
            });

            if (changed) {
              nextNotes.forEach((nextNote) => {
                if (String(nextNote.id) === noteId) {
                  void upsertCachedNote(nextNote);
                }
              });
            }

            return changed ? sortNotes(nextNotes) : currentNotes;
          });

          await removeOfflineAttachmentById(entryId);
        } catch {
          // keep entry for next retry when online again
        }
      }
    }

    async function flushLabelQueue() {
      const labelChanges = await getQueuedLabelChanges();
      if (labelChanges.length === 0) return;

      // Xử lý theo thứ tự: CREATE trước, sau đó UPDATE, cuối cùng DELETE
      const ordered = [
        ...labelChanges.filter((c) => c.action === 'CREATE'),
        ...labelChanges.filter((c) => c.action === 'UPDATE'),
        ...labelChanges.filter((c) => c.action === 'DELETE'),
      ];

      // Map temp_id → server_id để UPDATE/DELETE sau CREATE dùng đúng ID
      const tempToServerId = new Map();

      for (const change of ordered) {
        try {
          if (change.action === 'CREATE') {
            const created = await createLabel(change.payload.name);
            if (change.payload.temp_id) {
              tempToServerId.set(change.payload.temp_id, created.id);
              // Cập nhật UI: đổi tempId → serverId
              setLabels((currentLabels) =>
                currentLabels.map((l) =>
                  l.id === change.payload.temp_id ? { ...l, id: created.id } : l,
                ),
              );
            }
          } else if (change.action === 'UPDATE') {
            const realId = tempToServerId.get(change.payload.id) || change.payload.id;
            if (/^\d+$/.test(String(realId))) {
              await updateLabel(realId, change.payload.name);
            }
          } else if (change.action === 'DELETE') {
            const realId = tempToServerId.get(change.payload.id) || change.payload.id;
            if (/^\d+$/.test(String(realId))) {
              await deleteLabel(realId);
            }
          }
        } catch {
          // bỏ qua lỗi từng entry, tiếp tục flush các entry còn lại
        }
      }

      await clearQueuedLabelChanges();

      // Refresh lại labels từ server sau khi flush
      try {
        const freshLabels = await fetchLabelsFromServer();
        if (!isCancelled) {
          setLabels(freshLabels);
        }
      } catch {
        // giữ nguyên UI nếu fetch thất bại
      }
    }

    async function flushAndPullChanges() {
      const shouldNotifyReconnectSync = reconnectSyncPendingRef.current;

      try {
        await syncOfflineAttachments();

        // Dọn entries stale (LABEL_CREATE, etc.) từ DB version cũ
        try { await purgeStaleQueueEntries(); } catch { /* no-op */ }

        // Label queue được flush độc lập — lỗi ở đây không được làm hỏng sync note
        try {
          await flushLabelQueue();
        } catch {
          // no-op: giữ nguyên note sync flow
        }

        const queuedChanges = await getQueuedSyncChanges();

        // Các action hợp lệ cho note sync/push endpoint
        const VALID_NOTE_ACTIONS = new Set(['CREATE', 'UPDATE', 'DELETE', 'ATTACHMENT_ADD', 'ATTACHMENT_REMOVE']);

        if (queuedChanges.length > 0) {
          const changes = queuedChanges
            .filter((entry) => VALID_NOTE_ACTIONS.has(String(entry.action || '').toUpperCase()))
            .map((entry) => ({
              action: entry.action,
              entity_id: entry.entity_id,
              payload: entry.payload,
              timestamp: entry.timestamp,
            }));

          if (changes.length > 0) {
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
                      labels: Array.isArray(item.server_note.labels) ? item.server_note.labels.map(l => String(l.name || '')) : [],
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
          }

          // Luôn clear queue dù có valid changes hay không (dọn entries stale)
          await clearQueuedSyncChanges();
        }

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

        const [refreshedNotes, refreshedSharedRaw] = await Promise.all([
          fetchNotes(),
          fetchSharedWithMe().catch(() => []),
        ]);

        if (!isCancelled) {
          const refreshedSharedNotes = refreshedSharedRaw
            .map((share) => {
              const n = share?.note ?? share;
              if (!n?.id) return null;
              const attachments = Array.isArray(n.attachments) ? n.attachments : [];
              return {
                id: String(n.id),
                title: String(n.title || ''),
                content: String(n.content || ''),
                color: n.color || 'default',
                isPinned: Boolean(n.is_pinned),
                pinnedAt: n.pinned_at || undefined,
                isLocked: Boolean(n.is_protected),
                lockPassword: '',
                labels: Array.isArray(n.labels) ? n.labels.map(l => String(l.name || '')) : [],
                images: attachments.map((a) => String(a?.file_url || '')).filter(Boolean),
                attachments,
                sharedWith: Array.isArray(n.shares)
                  ? n.shares.map(s => ({
                    id: s?.id,
                    email: s.receiver?.email,
                    permission: s.permission,
                    receiver: s?.receiver,
                  }))
                  : [],
                ownerEmail: share?.sender?.email || null,
                ownerName: share?.sender?.name || null,
                ownerAvatar: share?.sender?.avatar || null,
                accessPermission: share?.permission || null,
                createdAt: n.created_at || new Date().toISOString(),
                updatedAt: n.updated_at || new Date().toISOString(),
                version: Number(n.version || 1),
              };
            })
            .filter(Boolean);

          const ownedIds = new Set(refreshedNotes.map((n) => String(n.id)));
          const merged = [
            ...refreshedNotes,
            ...refreshedSharedNotes.filter((n) => !ownedIds.has(String(n.id))),
          ];

          setNotes(sortNotes(merged));
          await cacheNotes(merged);
        }

        if (shouldNotifyReconnectSync && !isCancelled) {
          setNetworkNotice({
            variant: 'success',
            message: 'Đã online lại và đồng bộ dữ liệu thành công.',
          });
          reconnectSyncPendingRef.current = false;
        }
      } catch {
        if (shouldNotifyReconnectSync && !isCancelled) {
          setNetworkNotice({
            variant: 'danger',
            message: 'Đã online lại nhưng đồng bộ thất bại. Hệ thống sẽ thử lại tự động.',
          });
          reconnectSyncPendingRef.current = false;
        }
      }
    }

    void flushAndPullChanges();

    return () => {
      isCancelled = true;
    };
  }, [isOffline]);

  useEffect(() => {
    if (!networkNotice || isOffline) {
      return undefined;
    }

    if (networkNotice.variant === 'warning' || networkNotice.variant === 'info') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNetworkNotice(null);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [networkNotice, isOffline]);

  // Key ổn định: chỉ thay đổi khi tập hợp note IDs thay đổi (thêm/xóa note),
  // KHÔNG thay đổi khi nội dung note được cập nhật → tránh re-subscription loop.
  const subscribedNoteIdsKey = notes
    .filter((n) => isServerBackedId(String(n.id)))
    .map((n) => String(n.id))
    .sort()
    .join(',');

  useEffect(() => {
    const token = sessionStorage.getItem('auth_token');

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
          ownerEmail: remote.user?.email || note.ownerEmail,
          ownerName: remote.user?.name || note.ownerName,
          sharedWith: Array.isArray(remote.shares)
            ? remote.shares.map(s => ({ email: s.receiver?.email, permission: s.permission }))
            : note.sharedWith,
        };

        setNotes((currentNotes) =>
          sortNotes(
            currentNotes.map((currentNote) =>
              String(currentNote.id) === String(normalized.id) ? normalized : currentNote,
            ),
          ),
        );

        setEditingNote((currentEditing) => {
          if (currentEditing && String(currentEditing.id) === String(normalized.id)) {
            return { ...currentEditing, ...normalized };
          }
          return currentEditing;
        });

        void upsertCachedNote(normalized);
      }).then((unsubscribe) => {
        unsubscribers.push(unsubscribe);
      });
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
    // subscribedNoteIdsKey thay cho `notes`: chỉ re-subscribe khi danh sách ID thay đổi.
    // Nếu dùng `notes`, mỗi WS event → setNotes → notes ref mới → cleanup → gap không có sub → miss events.
  }, [isOffline, subscribedNoteIdsKey]);

  // Subscribe kênh cá nhân của user để nhận NoteShared event realtime
  useEffect(() => {
    const token = sessionStorage.getItem('auth_token');
    const userId = user?.id;

    if (!token || !userId || isOffline) {
      return;
    }

    let unsubscribe = () => { };

    void subscribeToUserChannel(userId, {
      onNoteShared: (payload) => {
        const remote = payload?.note;
        if (!remote || remote.id === undefined) return;

        const normalized = {
          id: String(remote.id),
          title: String(remote.title || ''),
          content: String(remote.content || ''),
          color: remote.color || 'default',
          isPinned: Boolean(remote.is_pinned),
          pinnedAt: remote.pinned_at || undefined,
          isLocked: Boolean(remote.is_protected),
          lockPassword: '',
          labels: [],
          images: Array.isArray(remote.attachments)
            ? remote.attachments.map((a) => String(a?.file_url || '')).filter(Boolean)
            : [],
          attachments: Array.isArray(remote.attachments) ? remote.attachments : [],
          sharedWith: Array.isArray(remote.shares)
            ? remote.shares.map(s => ({ email: s.receiver?.email, permission: s.permission }))
            : [],
          ownerEmail: payload?.sender?.email || null,
          ownerName: payload?.sender?.name || null,
          accessPermission: payload?.permission || null,
          createdAt: remote.created_at || new Date().toISOString(),
          updatedAt: remote.updated_at || new Date().toISOString(),
          version: Number(remote.version || 1),
        };

        setNotes((currentNotes) => {
          const index = currentNotes.findIndex((n) => String(n.id) === String(normalized.id));

          if (index !== -1) {
            // Cập nhật note đã tồn tại (bao gồm cả quyền truy cập)
            const next = [...currentNotes];
            next[index] = { ...next[index], ...normalized };
            return sortNotes(next);
          }

          // Thêm note mới được chia sẻ
          import('sonner').then(({ toast }) =>
            toast.success(`Bạn vừa được chia sẻ một ghi chú mới!`)
          );
          return sortNotes([normalized, ...currentNotes]);
        });

        void upsertCachedNote(normalized);

        // Subscribe channel của note mới để nhận NoteUpdated realtime
        void subscribeToNoteChannel(remote.id, (updatePayload) => {
          const updatedNote = updatePayload?.note;
          if (!updatedNote || updatedNote.id === undefined) return;

          setNotes((currentNotes) =>
            sortNotes(
              currentNotes.map((n) =>
                String(n.id) === String(updatedNote.id)
                  ? {
                    ...n,
                    title: String(updatedNote.title || ''),
                    content: String(updatedNote.content || ''),
                    color: updatedNote.color || n.color,
                    isPinned: Boolean(updatedNote.is_pinned),
                    pinnedAt: updatedNote.pinned_at || undefined,
                    updatedAt: updatedNote.updated_at || new Date().toISOString(),
                    version: Number(updatedNote.version || n.version || 1),
                    attachments: Array.isArray(updatedNote.attachments) ? updatedNote.attachments : [],
                    images: Array.isArray(updatedNote.attachments)
                      ? updatedNote.attachments.map((a) => String(a?.file_url || '')).filter(Boolean)
                      : n.images,
                  }
                  : n
              )
            )
          );

          setEditingNote((currentEditing) => {
            if (currentEditing && String(currentEditing.id) === String(updatedNote.id)) {
              return {
                ...currentEditing,
                title: String(updatedNote.title || ''),
                content: String(updatedNote.content || ''),
                color: updatedNote.color || currentEditing.color,
                isPinned: Boolean(updatedNote.is_pinned),
                pinnedAt: updatedNote.pinned_at || undefined,
                updatedAt: updatedNote.updated_at || new Date().toISOString(),
                version: Number(updatedNote.version || currentEditing.version || 1),
                attachments: Array.isArray(updatedNote.attachments) ? updatedNote.attachments : [],
                images: Array.isArray(updatedNote.attachments)
                  ? updatedNote.attachments.map((a) => String(a?.file_url || '')).filter(Boolean)
                  : currentEditing.images,
              };
            }
            return currentEditing;
          });
        });
      },
      onNoteRevoked: (payload) => {
        const noteId = String(payload?.note_id);
        if (!noteId) return;

        setNotes((currentNotes) => {
          const exists = currentNotes.some((n) => String(n.id) === noteId);
          if (exists) {
            import('sonner').then(({ toast }) =>
              toast.info(`Quyền truy cập một ghi chú đã bị thu hồi.`)
            );
          }
          return currentNotes.filter((n) => String(n.id) !== noteId);
        });
      },
    }).then((fn) => {
      unsubscribe = fn;
    });

    return () => unsubscribe();
  }, [isOffline, user?.id]);

  // Subscribe to realtime updates for all owned notes
  useEffect(() => {
    if (isOffline || !Array.isArray(notes)) {
      return undefined;
    }

    const unsubscribers = [];

    // Subscribe to each note that belongs to current user
    const ownedNotes = notes.filter((n) => /^\d+$/.test(String(n.id)));

    for (const note of ownedNotes) {
      subscribeToNoteChannel(note.id, (payload) => {
        if (!payload?.note) return;

        const updatedNote = payload.note;

        setNotes((currentNotes) => {
          const index = currentNotes.findIndex((n) => String(n.id) === String(updatedNote.id));
          if (index === -1) return currentNotes;

          const normalized = {
            ...currentNotes[index],
            title: String(updatedNote.title || ''),
            content: String(updatedNote.content || ''),
            color: updatedNote.color || 'default',
            updatedAt: updatedNote.updated_at || new Date().toISOString(),
            version: Number(updatedNote.version || currentNotes[index]?.version || 1),
            sharedWith: Array.isArray(updatedNote.shares)
              ? updatedNote.shares.map((s) => ({
                id: s?.id,
                email: s.receiver?.email,
                permission: s.permission,
                receiver: s?.receiver,
              }))
              : [],
            isLocked: Boolean(updatedNote.is_protected),
            attachments: Array.isArray(updatedNote.attachments) ? updatedNote.attachments : [],
            images: Array.isArray(updatedNote.attachments)
              ? updatedNote.attachments.map((a) => String(a?.file_url || '')).filter(Boolean)
              : [],
          };

          const nextNotes = [...currentNotes];
          nextNotes[index] = normalized;
          return sortNotes(nextNotes);
        });

        setEditingNote((currentEditing) => {
          if (currentEditing && String(currentEditing.id) === String(updatedNote.id)) {
            return {
              ...currentEditing,
              title: String(updatedNote.title || ''),
              content: String(updatedNote.content || ''),
              color: updatedNote.color || 'default',
              updatedAt: updatedNote.updated_at || new Date().toISOString(),
              version: Number(updatedNote.version || currentEditing.version || 1),
              sharedWith: Array.isArray(updatedNote.shares)
                ? updatedNote.shares.map((s) => ({
                  id: s?.id,
                  email: s.receiver?.email,
                  permission: s.permission,
                  receiver: s?.receiver,
                }))
                : [],
              isLocked: Boolean(updatedNote.is_protected),
              attachments: Array.isArray(updatedNote.attachments) ? updatedNote.attachments : [],
              images: Array.isArray(updatedNote.attachments)
                ? updatedNote.attachments.map((a) => String(a?.file_url || '')).filter(Boolean)
                : [],
            };
          }
          return currentEditing;
        });
      })
        .then((unsubscribe) => {
          unsubscribers.push(unsubscribe);
        })
        .catch(() => {
          // Realtime unavailable
        });
    }

    return () => {
      unsubscribers.forEach((fn) => {
        try {
          fn();
        } catch {
          // Ignore errors
        }
      });
    };
  }, [notes.length, isOffline]);

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
        defaultColor={resolvedNotePreferences.defaultNoteColor}
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
    if (note?.isLocked) {
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

  async function handleConfirmUnlock() {
    if (!unlockingNote) {
      return;
    }

    const noteId = unlockingNote.id;
    const inputPassword = unlockPassword.trim();

    if (!inputPassword) {
      setUnlockError('Vui lòng nhập mật khẩu.');
      return;
    }

    // Nếu note có ID từ server, gọi API verify
    if (isServerBackedId(noteId)) {
      if (isOffline) {
        setUnlockError('Bạn cần có kết nối mạng để mở ghi chú đã khóa.');
        return;
      }
      try {
        const result = await verifyNotePassword(noteId, inputPassword);
        if (result?.valid && result?.note) {
          const unlockedNote = {
            ...result.note,
            labels: unlockingNote.labels, // Giữ nguyên nhãn vì API có thể chưa load labels
            lockPassword: inputPassword, // Lưu lại password ở client để sửa và lưu note
          };
          setEditingNote(unlockedNote);
          setEditorOpen(true);
          handleCancelUnlock();
          return;
        }
      } catch {
        setUnlockError('Mật khẩu không đúng.');
        return;
      }
    } else {
      // Note local-only: so sánh client-side
      const expectedPassword = String(unlockingNote.lockPassword || '').trim();
      if (expectedPassword.length > 0 && inputPassword !== expectedPassword) {
        setUnlockError('Mật khẩu không đúng.');
        return;
      }
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

    setEditingNote((currentEditing) => {
      if (!currentEditing || currentEditing.id === nextNote.id) {
        return noteWithVersion;
      }
      return currentEditing;
    });

    void upsertCachedNote(noteWithVersion);

    const token = sessionStorage.getItem('auth_token');

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
      if (pendingCreatesRef.current.has(noteWithVersion.id)) {
        // A creation is already in progress, store the latest draft to be synced after it finishes
        pendingCreatesRef.current.set(noteWithVersion.id, noteWithVersion);
        return;
      }

      pendingCreatesRef.current.set(noteWithVersion.id, null);

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
              return upsertCachedNote(mergedCreatedNote).then(() => {
                const latestDraft = pendingCreatesRef.current.get(noteWithVersion.id);
                pendingCreatesRef.current.delete(noteWithVersion.id);

                if (latestDraft) {
                  // Re-trigger save with the new server ID and latest content
                  handleSave({ ...latestDraft, id: createdNote.id });
                }
              });
            });
        })
        .catch(() => {
          pendingCreatesRef.current.delete(noteWithVersion.id);
          void enqueueSyncChange({
            action: 'CREATE',
            entity_id: String(noteWithVersion.id),
            payload: toSyncPayload(noteWithVersion),
            timestamp: now,
          });
        });
      return;
    }

    const originalNote = notes.find((n) => n.id === noteWithVersion.id);
    const shareMeta = originalNote && user?.email ? resolveNoteShareMeta(originalNote, user.email) : null;
    const isReadOnly = shareMeta ? (shareMeta.isReceivedShared && shareMeta.myPermission === 'read') : false;

    if (isReadOnly) {
      void syncNoteLabels(noteWithVersion.id);
      return;
    }

    if (pendingUpdatesRef.current.has(noteWithVersion.id)) {
      pendingUpdatesRef.current.set(noteWithVersion.id, noteWithVersion);
      return;
    }

    pendingUpdatesRef.current.set(noteWithVersion.id, null);

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
            return upsertCachedNote(mergedUpdatedNote).then(() => {
              const latestDraft = pendingUpdatesRef.current.get(noteWithVersion.id);
              pendingUpdatesRef.current.delete(noteWithVersion.id);

              if (latestDraft) {
                handleSave({ ...latestDraft, version: mergedUpdatedNote.version });
              }
            });
          });
      })
      .catch((error) => {
        pendingUpdatesRef.current.delete(noteWithVersion.id);
        if (error?.code === 'CONFLICT' && error?.serverNote) {
          setNotes((currentNotes) =>
            sortNotes(
              currentNotes.map((note) =>
                note.id === noteWithVersion.id ? error.serverNote : note,
              ),
            ),
          );
          toast.warning('Ghi chú đã được cập nhật bởi người khác. Dữ liệu mới nhất đã được tải về.');
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
    // Thực hiện xóa thật sự
    setNotes((currentNotes) => {
      const nextNotes = currentNotes.filter((item) => item.id !== noteId);
      void cacheNotes(nextNotes);
      return nextNotes;
    });
    setEditingNote(null);
    setEditorOpen(false);
    setDeleteConfirmNote(null); // Đóng modal nếu đang mở

    const token = sessionStorage.getItem('auth_token');
    if (!token) return;

    const timestamp = new Date().toISOString();

    if (isOffline || !isServerBackedId(noteId)) {
      void enqueueSyncChange({
        action: 'DELETE',
        entity_id: String(noteId),
        payload: null,
        timestamp,
      });
      return;
    }

    void deleteNoteOnServer(noteId).catch(() => {
      void enqueueSyncChange({
        action: 'DELETE',
        entity_id: String(noteId),
        payload: null,
        timestamp,
      });
    });
  }

  function requestDelete(note) {
    // Luôn yêu cầu xác nhận trước khi xóa, đặc biệt là ghi chú bị khóa
    setDeleteConfirmNote(note);
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

    const token = sessionStorage.getItem('auth_token');

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

    const token = sessionStorage.getItem('auth_token');
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
          // Gọi API thất bại khi đang online → fallback thêm local + enqueue
          const tempId = crypto.randomUUID();
          setLabels((currentLabels) => {
            const normalizedKey = normalizedName.toLowerCase();
            if (currentLabels.some((label) => label.name.trim().toLowerCase() === normalizedKey)) {
              return currentLabels;
            }
            return [...currentLabels, { id: tempId, name: normalizedName }];
          });
          void enqueueLabelChange({
            action: 'CREATE',
            payload: { temp_id: tempId, name: normalizedName },
            timestamp: new Date().toISOString(),
          });
        });
      return;
    }

    // Offline: thêm local optimistically + enqueue
    const tempId = crypto.randomUUID();
    setLabels((currentLabels) => {
      const normalizedKey = normalizedName.toLowerCase();
      if (currentLabels.some((label) => label.name.trim().toLowerCase() === normalizedKey)) {
        return currentLabels;
      }
      return [...currentLabels, { id: tempId, name: normalizedName }];
    });
    void enqueueLabelChange({
      action: 'CREATE',
      payload: { temp_id: tempId, name: normalizedName },
      timestamp: new Date().toISOString(),
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

    // Cập nhật UI ngay (optimistic)
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

    const token = sessionStorage.getItem('auth_token');
    if (!token) return;

    if (isOffline || !/^\d+$/.test(String(labelId))) {
      // Offline hoặc label chưa có server ID (tạo offline chưa sync) → enqueue
      void enqueueLabelChange({
        action: 'UPDATE',
        payload: { id: String(labelId), name: normalizedNextName },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    void updateLabel(labelId, normalizedNextName).catch(() => {
      void enqueueLabelChange({
        action: 'UPDATE',
        payload: { id: String(labelId), name: normalizedNextName },
        timestamp: new Date().toISOString(),
      });
    });
  }

  function handleDeleteLabel(labelId) {
    const label = labels.find((item) => item.id === labelId);

    setLabels((currentLabels) => currentLabels.filter((item) => item.id !== labelId));
    setSelectedLabels((currentLabels) => currentLabels.filter((item) => item !== label?.name));
    setNotes((currentNotes) =>
      currentNotes.map((note) => ({
        ...note,
        labels: note.labels.filter((item) => item !== label?.name),
      })),
    );

    if (!label) return;

    const token = sessionStorage.getItem('auth_token');
    if (!token) return;

    // Label chưa có server ID (UUID) → chỉ cần xóa khỏi queue CREATE nếu có, không cần gọi API
    if (!/^\d+$/.test(String(labelId))) {
      // no-op: server không biết label này tồn tại
      return;
    }

    if (isOffline) {
      void enqueueLabelChange({
        action: 'DELETE',
        payload: { id: String(labelId) },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    void deleteLabel(labelId).catch(() => {
      void enqueueLabelChange({
        action: 'DELETE',
        payload: { id: String(labelId) },
        timestamp: new Date().toISOString(),
      });
    });
  }

  function handleUpdateProfilePreferences(nextPreferences) {
    const newPreferences = {
      ...resolvedNotePreferences,
      ...nextPreferences,
      fontSize: resolveNoteFontSize(nextPreferences?.fontSize),
    };

    setUser((currentUser) => ({
      ...currentUser,
      preferences: newPreferences,
    }));

    // Đồng bộ sessionStorage để reload trang không mất preferences
    try {
      const authUser = JSON.parse(sessionStorage.getItem('auth_user') || '{}');
      authUser.preferences = newPreferences;
      sessionStorage.setItem('auth_user', JSON.stringify(authUser));
    } catch { /* ignore */ }

    import('../features/auth/services/authService').then(m => m.updatePreferences(newPreferences)).catch(() => { });
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
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
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

      {networkNotice ? (
        <div className="container-fluid mt-3">
          <div className={`alert alert-${networkNotice.variant} py-2 mb-0`} role="status" aria-live="polite">
            {networkNotice.message}
          </div>
        </div>
      ) : null}

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
          key="active-editor-modal"
          note={editingNote}
          open={editorOpen}
          currentUserEmail={user?.email}
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
          const newPrefs = {
            ...(user?.preferences || DEFAULT_NOTE_PREFERENCES),
            ...(nextPreferences || {}),
            fontSize: resolveNoteFontSize(nextPreferences?.fontSize),
          };
          setUser((currentUser) => ({
            ...currentUser,
            preferences: newPrefs,
          }));
          try {
            const authUser = JSON.parse(sessionStorage.getItem('auth_user') || '{}');
            authUser.preferences = newPrefs;
            sessionStorage.setItem('auth_user', JSON.stringify(authUser));
          } catch { /* ignore */ }
          import('../features/auth/services/authService').then(m => m.updatePreferences(newPrefs)).catch(() => { });
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
            name="noteUnlockPassword"
            autoComplete="off"
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
        <Modal.Footer className="border-0 pt-0 d-flex justify-content-between align-items-center">
          <Button
            variant="outline-danger"
            className="btn-sm fw-semibold d-flex align-items-center gap-2 px-3"
            style={{ borderRadius: '8px' }}
            onClick={() => {
              setUnlockingNote(null);
              requestDelete(unlockingNote);
            }}
          >
            Xóa ghi chú
          </Button>
          <div className="d-flex gap-2">
            <Button variant="light" onClick={handleCancelUnlock} className="border">
              Hủy
            </Button>
            <Button variant="primary" onClick={handleConfirmUnlock}>
              Mở ghi chú
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <NoteDeleteConfirmDialog
        open={Boolean(deleteConfirmNote)}
        noteTitle={deleteConfirmNote?.title || 'Ghi chú đã khóa'}
        onConfirm={() => handleDelete(deleteConfirmNote.id)}
        onCancel={() => setDeleteConfirmNote(null)}
      />

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
