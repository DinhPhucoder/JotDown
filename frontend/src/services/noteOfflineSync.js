const DB_NAME = 'jotdown-offline-sync';
const DB_VERSION = 1;
const NOTES_STORE = 'notes_cache';
const QUEUE_STORE = 'sync_queue';
const META_STORE = 'meta';

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
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Cannot open IndexedDB'));
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

      if (existing) {
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
