const OFFLINE_ATTACHMENT_DB = 'jotdown-offline-attachments';
const OFFLINE_ATTACHMENT_DB_VERSION = 1;
const OFFLINE_ATTACHMENT_STORE = 'attachments';

function openOfflineAttachmentDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_ATTACHMENT_DB, OFFLINE_ATTACHMENT_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(OFFLINE_ATTACHMENT_STORE)) {
        const store = db.createObjectStore(OFFLINE_ATTACHMENT_STORE, { keyPath: 'id' });
        store.createIndex('by_note_id', 'note_id', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Cannot open offline attachment database'));
  });
}

function withStore(mode, work) {
  return openOfflineAttachmentDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_ATTACHMENT_STORE, mode);
        const store = tx.objectStore(OFFLINE_ATTACHMENT_STORE);

        tx.oncomplete = () => resolve(undefined);
        tx.onerror = () => reject(tx.error || new Error('Offline attachment transaction failed'));
        tx.onabort = () => reject(tx.error || new Error('Offline attachment transaction aborted'));

        work(store, resolve, reject);
      }),
  );
}

export async function saveOfflineAttachment(entry) {
  await withStore('readwrite', (store) => {
    store.put(entry);
  });
}

export async function getOfflineAttachments() {
  return withStore('readonly', (store, resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error('Failed to read offline attachments'));
  });
}

export async function removeOfflineAttachmentById(id) {
  await withStore('readwrite', (store) => {
    store.delete(String(id));
  });
}
