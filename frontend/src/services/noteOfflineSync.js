const DB_NAME = 'jotdown-offline-sync';
const DB_VERSION = 2;
const NOTES_STORE = 'notes_cache';
const QUEUE_STORE = 'sync_queue';
const META_STORE = 'meta';
const LABEL_QUEUE_STORE = 'label_sync_queue';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }

      // v2: thêm store riêng cho label sync queue
      if (!db.objectStoreNames.contains(LABEL_QUEUE_STORE)) {
        db.createObjectStore(LABEL_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      // Khi tab khác mở DB version mới hơn, tự động đóng kết nối này
      db.onversionchange = () => {
        db.close();
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error || new Error('Cannot open IndexedDB'));
    // Tab cũ đang giữ kết nối → block upgrade. Reject để không treo vô hạn.
    request.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another tab'));
  });
}

function withStore(storeName, mode, work) {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        transaction.oncomplete = () => resolve(undefined);
        transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed'));
        transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));

        work(store, resolve, reject);
      }),
  );
}

export async function cacheNotes(notes) {
  const normalized = Array.isArray(notes) ? notes : [];

  await withStore(NOTES_STORE, 'readwrite', (store) => {
    store.clear();
    normalized.forEach((note) => store.put(note));
  });
}

export async function getCachedNotes() {
  return withStore(NOTES_STORE, 'readonly', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error('Failed to read cached notes'));
  });
}

export async function upsertCachedNote(note) {
  await withStore(NOTES_STORE, 'readwrite', (store) => {
    store.put(note);
  });
}

export async function removeCachedNote(noteId) {
  await withStore(NOTES_STORE, 'readwrite', (store) => {
    store.delete(String(noteId));
  });
}

export async function enqueueSyncChange(change) {
  const normalizedEntityId = String(change?.entity_id ?? '');
  const nextAction = String(change?.action || '').toUpperCase();

  await withStore(QUEUE_STORE, 'readwrite', (store, _resolve, reject) => {
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      const existingChanges = (getAllRequest.result || []).filter(
        (item) => String(item?.entity_id ?? '') === normalizedEntityId,
      );
      const existing = existingChanges.find((item) => String(item?.action || '').toUpperCase() === nextAction);

      if (nextAction === 'DELETE' && existing && String(existing.action || '').toUpperCase() === 'CREATE') {
        store.delete(existing.id);
        return;
      }

      if (existing && !['ATTACHMENT_ADD', 'ATTACHMENT_REMOVE'].includes(nextAction)) {
        store.put({ ...change, id: existing.id });
        return;
      }

      store.add(change);
    };

    getAllRequest.onerror = () => reject(getAllRequest.error || new Error('Failed to load queued changes'));
  });
}

export async function getQueuedSyncChanges() {
  return withStore(QUEUE_STORE, 'readonly', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error('Failed to load sync queue'));
  });
}

// Xóa các entries cũ có action không nằm trong whitelist của /sync/push
const VALID_SYNC_ACTIONS = new Set(['CREATE', 'UPDATE', 'DELETE', 'ATTACHMENT_ADD', 'ATTACHMENT_REMOVE']);
export async function purgeStaleQueueEntries() {
  await withStore(QUEUE_STORE, 'readwrite', (store, _resolve, reject) => {
    const getAllReq = store.getAll();
    getAllReq.onsuccess = () => {
      const staleIds = (getAllReq.result || [])
        .filter((entry) => !VALID_SYNC_ACTIONS.has(String(entry?.action || '').toUpperCase()))
        .map((entry) => entry.id)
        .filter(Boolean);
      staleIds.forEach((id) => store.delete(id));
    };
    getAllReq.onerror = () => reject(getAllReq.error || new Error('Failed to purge stale queue entries'));
  });
}

export async function removeQueuedSyncChanges(ids) {
  const normalizedIds = (Array.isArray(ids) ? ids : []).filter((id) => Number.isInteger(id));

  if (normalizedIds.length === 0) {
    return;
  }

  await withStore(QUEUE_STORE, 'readwrite', (store) => {
    normalizedIds.forEach((id) => store.delete(id));
  });
}

export async function clearQueuedSyncChanges() {
  await withStore(QUEUE_STORE, 'readwrite', (store) => {
    store.clear();
  });
}

export async function setLastSyncCursor(value) {
  await withStore(META_STORE, 'readwrite', (store) => {
    store.put({ key: 'last_sync_cursor', value });
  });
}

export async function getLastSyncCursor() {
  return withStore(META_STORE, 'readonly', (store, resolve, reject) => {
    const request = store.get('last_sync_cursor');
    request.onsuccess = () => resolve(request.result?.value || null);
    request.onerror = () => reject(request.error || new Error('Failed to read sync cursor'));
  });
}

// ─── Label Sync Queue ────────────────────────────────────────────────────────
// Mỗi entry có dạng: { action: 'CREATE'|'UPDATE'|'DELETE', payload: {...}, timestamp }

export async function enqueueLabelChange(change) {
  await withStore(LABEL_QUEUE_STORE, 'readwrite', (store, _resolve, reject) => {
    const addRequest = store.add({
      action: String(change?.action || '').toUpperCase(),
      payload: change?.payload ?? null,
      timestamp: change?.timestamp || new Date().toISOString(),
    });
    addRequest.onerror = () => reject(addRequest.error || new Error('Failed to enqueue label change'));
  });
}

export async function getQueuedLabelChanges() {
  return withStore(LABEL_QUEUE_STORE, 'readonly', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error('Failed to load label sync queue'));
  });
}

export async function clearQueuedLabelChanges() {
  await withStore(LABEL_QUEUE_STORE, 'readwrite', (store) => {
    store.clear();
  });
}
