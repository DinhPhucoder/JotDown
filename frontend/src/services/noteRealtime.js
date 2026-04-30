let base = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';
if (base.endsWith('/')) base = base.slice(0, -1);
if (base !== '' && !base.endsWith('/api')) base += '/api';
const API_BASE = base;
const BROADCAST_AUTH_ENDPOINT = `${API_BASE.replace(/\/api\/?$/, '')}/broadcasting/auth`;

let echoInstancePromise = null;

async function createEchoInstance() {
  const echoModuleName = 'laravel-echo';
  const pusherModuleName = 'pusher-js';

  const [{ default: Echo }, { default: Pusher }] = await Promise.all([
    import(/* @vite-ignore */ echoModuleName),
    import(/* @vite-ignore */ pusherModuleName),
  ]);

  window.Pusher = Pusher;

  return new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    authEndpoint: BROADCAST_AUTH_ENDPOINT,
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
    },
  });
}

async function getEchoInstance() {
  if (!echoInstancePromise) {
    echoInstancePromise = createEchoInstance().catch((error) => {
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
    const handler = (payload) => {
      if (typeof onEvent === 'function') {
        onEvent(payload);
      }
    };

    channel.listen('NoteUpdated', handler);

    return () => {
      channel.stopListening('NoteUpdated');
      echo.leave(`private-note.${noteId}`);
    };
  } catch {
    return () => {};
  }
}
