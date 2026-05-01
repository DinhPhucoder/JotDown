let base = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';
if (base.endsWith('/')) base = base.slice(0, -1);
if (base !== '' && !base.endsWith('/api')) base += '/api';
const API_BASE = base;
const BROADCAST_AUTH_ENDPOINT = `${API_BASE.replace(/\/api\/?$/, '')}/broadcasting/auth`;

let echoInstancePromise = null;

async function createEchoInstance() {
  console.log('[Realtime] Creating Echo instance with:', {
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    authEndpoint: BROADCAST_AUTH_ENDPOINT,
  });

  const [{ default: Echo }, { default: Pusher }] = await Promise.all([
    import('laravel-echo'),
    import('pusher-js'),
  ]);

  window.Pusher = Pusher;

  const echoInstance = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    authEndpoint: BROADCAST_AUTH_ENDPOINT,
    auth: {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('auth_token') || ''}`,
      },
    },
  });

  console.log('[Realtime] Echo instance created successfully');
  return echoInstance;
}

async function getEchoInstance() {
  if (!echoInstancePromise) {
    echoInstancePromise = createEchoInstance().catch((error) => {
      console.error('[Realtime] Failed to create Echo instance:', error);
      echoInstancePromise = null;
      throw error;
    });
  }

  return echoInstancePromise;
}

export async function subscribeToNoteChannel(noteId, onEvent) {
  try {
    const echo = await getEchoInstance();
    const channel = echo.private(`note.${noteId}`);
    
    console.log(`[Realtime] Subscribed to note.${noteId}`);
    
    const handler = (payload) => {
      console.log(`[Realtime] Received event on note.${noteId}:`, payload);
      if (typeof onEvent === 'function') {
        onEvent(payload);
      }
    };

    channel.listen('.NoteUpdated', handler);

    return () => {
      console.log(`[Realtime] Unsubscribed from note.${noteId}`);
      channel.stopListening('.NoteUpdated', handler);
      // We shouldn't leave the channel immediately if there are other listeners,
      // but Laravel Echo's leave() doesn't do reference counting. 
      // If we leave the channel, no one gets events. 
      // Actually, NotesPage.jsx re-subscribes immediately. But if we leave, we drop connection temporarily.
      // Better yet, just remove the listener. 
    };
  } catch (err) {
    console.error(`[Realtime] Failed to subscribe to note.${noteId}:`, err);
    return () => {};
  }
}

/**
 * Subscribe vào channel cá nhân của user để nhận các event:
 *   - NoteShared: khi có người share note mới cho mình
 *
 * @param {string|number} userId
 * @param {{ onNoteShared?: Function, onNoteRevoked?: Function }} handlers
 * @returns {Promise<Function>} unsubscribe
 */
export async function subscribeToUserChannel(userId, { onNoteShared, onNoteRevoked } = {}) {
  try {
    const echo = await getEchoInstance();
    const channel = echo.private(`user.${userId}`);

    if (typeof onNoteShared === 'function') {
      channel.listen('.NoteShared', onNoteShared);
    }

    if (typeof onNoteRevoked === 'function') {
      channel.listen('.NoteRevoked', onNoteRevoked);
    }

    return () => {
      if (typeof onNoteShared === 'function') {
        channel.stopListening('.NoteShared', onNoteShared);
      }
      if (typeof onNoteRevoked === 'function') {
        channel.stopListening('.NoteRevoked', onNoteRevoked);
      }
    };
  } catch {
    return () => {};
  }
}
