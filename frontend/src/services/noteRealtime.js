let base = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';
if (base.endsWith('/')) base = base.slice(0, -1);
if (base !== '' && !base.endsWith('/api')) base += '/api';
const API_BASE = base;

function resolveBackendOrigin() {
  const backendBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  if (backendBase && /^https?:\/\//i.test(String(backendBase))) {
    try {
      return new URL(backendBase, window.location.origin).origin;
    } catch {
      return window.location.origin;
    }
  }

  const proxyTarget = import.meta.env.VITE_PROXY_TARGET;

  if (proxyTarget) {
    try {
      return new URL(proxyTarget, window.location.origin).origin;
    } catch {
      return window.location.origin;
    }
  }

  return window.location.origin;
}

const BROADCAST_AUTH_ENDPOINT = `${resolveBackendOrigin()}/broadcasting/auth`;
const REALTIME_DEBUG_ENABLED = import.meta.env.VITE_REALTIME_DEBUG !== 'false';

function realtimeLog(...args) {
  if (REALTIME_DEBUG_ENABLED) {
    console.log(...args);
  }
}

function summarizeNote(note) {
  if (!note) {
    return null;
  }

  return {
    id: note.id != null ? String(note.id) : null,
    version: Number(note.version || 1),
    updatedAt: note.updated_at || note.updatedAt || null,
    title: String(note.title || ''),
    titleLength: String(note.title || '').length,
    contentLength: String(note.content || '').length,
    isPinned: Boolean(note.is_pinned),
    isProtected: Boolean(note.is_protected),
    attachmentCount: Array.isArray(note.attachments) ? note.attachments.length : 0,
    shareCount: Array.isArray(note.shares) ? note.shares.length : 0,
  };
}

function summarizeRealtimePayload(eventName, payload) {
  const note = payload?.note;

  return {
    event: eventName,
    payloadKeys: payload ? Object.keys(payload) : [],
    updatedBy: payload?.updated_by || null,
    note: summarizeNote(note),
  };
}

function bindPusherDebugListeners(echoInstance) {
  const pusher = echoInstance?.connector?.pusher;
  const connection = pusher?.connection;

  if (!pusher || !connection) {
    realtimeLog('[Realtime] Pusher debug listeners skipped: connection not available');
    return;
  }

  connection.bind('state_change', (states) => {
    realtimeLog('[Realtime] Pusher state change', {
      previous: states?.previous || null,
      current: states?.current || null,
      socketId: getSocketId(),
    });
  });

  connection.bind('connected', () => {
    realtimeLog('[Realtime] Pusher connected', {
      socketId: getSocketId(),
    });
  });

  connection.bind('disconnected', () => {
    realtimeLog('[Realtime] Pusher disconnected', {
      socketId: getSocketId(),
    });
  });

  connection.bind('error', (error) => {
    realtimeLog('[Realtime] Pusher connection error', {
      socketId: getSocketId(),
      error,
    });
  });
}

let echoInstancePromise = null;

async function createEchoInstance() {
  realtimeLog('[Realtime] Creating Echo instance with:', {
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    authEndpoint: BROADCAST_AUTH_ENDPOINT,
    backendOrigin: resolveBackendOrigin(),
    realtimeDebugEnabled: REALTIME_DEBUG_ENABLED,
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
    // Dùng authorizer thay vì auth.headers để token được đọc
    // fresh mỗi lần Pusher reconnect (tránh 403 sau khi offline)
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        fetch(BROADCAST_AUTH_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('auth_token') || ''}`,
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then((res) => res.json())
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      },
    }),
  });

  bindPusherDebugListeners(echoInstance);

  realtimeLog('[Realtime] Echo auth bootstrap complete', {
    authEndpoint: BROADCAST_AUTH_ENDPOINT,
    hasAuthToken: Boolean(sessionStorage.getItem('auth_token')),
  });
  realtimeLog('[Realtime] Echo instance created successfully');
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

export function getSocketId() {
  return echoInstancePromise?.socketId ? echoInstancePromise.socketId() : null;
}

export async function subscribeToNoteChannel(noteId, onEvent) {
  try {
    const echo = await getEchoInstance();
    const channel = echo.private(`note.${noteId}`);
    const channelName = `note.${noteId}`;
    
    realtimeLog('[Realtime] Subscribing to note channel', {
      channel: channelName,
      socketId: getSocketId(),
      hasHandler: typeof onEvent === 'function',
      authEndpoint: BROADCAST_AUTH_ENDPOINT,
    });
    realtimeLog('[Realtime] Channel object created for note subscription', {
      channel: channelName,
      methods: {
        listen: typeof channel.listen === 'function',
        stopListening: typeof channel.stopListening === 'function',
      },
    });
    
    const handler = (payload) => {
      const startedAt = performance.now();
      realtimeLog('[Realtime] Note channel event received', {
        channel: channelName,
        ...summarizeRealtimePayload('NoteUpdated', payload),
      });
      realtimeLog('[Realtime] Dispatching NoteUpdated callback', {
        channel: channelName,
        hasHandler: typeof onEvent === 'function',
      });
      if (typeof onEvent === 'function') {
        onEvent(payload);
      }
      realtimeLog('[Realtime] NoteUpdated callback finished', {
        channel: channelName,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
      });
    };

    channel.listen('.NoteUpdated', handler);

    realtimeLog('[Realtime] Listening for NoteUpdated', {
      channel: `note.${noteId}`,
      event: '.NoteUpdated',
    });

    return () => {
      realtimeLog('[Realtime] Unsubscribing from note channel', {
        channel: channelName,
        event: '.NoteUpdated',
        socketId: getSocketId(),
      });
      channel.stopListening('.NoteUpdated', handler);
      realtimeLog('[Realtime] Note channel listener removed', {
        channel: channelName,
        event: '.NoteUpdated',
      });
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
    const channelName = `user.${userId}`;
    const channel = echo.private(channelName);

    realtimeLog('[Realtime] Subscribing to user channel', {
      channel: channelName,
      socketId: getSocketId(),
      listenNoteShared: typeof onNoteShared === 'function',
      listenNoteRevoked: typeof onNoteRevoked === 'function',
      authEndpoint: BROADCAST_AUTH_ENDPOINT,
    });
    realtimeLog('[Realtime] Channel object created for user subscription', {
      channel: channelName,
      methods: {
        listen: typeof channel.listen === 'function',
        stopListening: typeof channel.stopListening === 'function',
      },
    });

    if (typeof onNoteShared === 'function') {
      channel.listen('.NoteShared', (payload) => {
        const startedAt = performance.now();
        realtimeLog('[Realtime] User channel event received', {
          channel: channelName,
          ...summarizeRealtimePayload('NoteShared', payload),
        });
        realtimeLog('[Realtime] Dispatching NoteShared callback', {
          channel: channelName,
          hasHandler: true,
        });
        onNoteShared(payload);
        realtimeLog('[Realtime] NoteShared callback finished', {
          channel: channelName,
          durationMs: Number((performance.now() - startedAt).toFixed(2)),
        });
      });
      realtimeLog('[Realtime] Listening for NoteShared', {
        channel: channelName,
        event: '.NoteShared',
      });
    }

    if (typeof onNoteRevoked === 'function') {
      channel.listen('.NoteRevoked', (payload) => {
        const startedAt = performance.now();
        realtimeLog('[Realtime] User channel event received', {
          channel: channelName,
          event: 'NoteRevoked',
          payloadKeys: payload ? Object.keys(payload) : [],
          noteId: payload?.note_id != null ? String(payload.note_id) : null,
        });
        realtimeLog('[Realtime] Dispatching NoteRevoked callback', {
          channel: channelName,
          hasHandler: true,
        });
        onNoteRevoked(payload);
        realtimeLog('[Realtime] NoteRevoked callback finished', {
          channel: channelName,
          durationMs: Number((performance.now() - startedAt).toFixed(2)),
        });
      });
      realtimeLog('[Realtime] Listening for NoteRevoked', {
        channel: channelName,
        event: '.NoteRevoked',
      });
    }

    return () => {
      realtimeLog('[Realtime] Unsubscribing from user channel', {
        channel: channelName,
        socketId: getSocketId(),
      });
      if (typeof onNoteShared === 'function') {
        channel.stopListening('.NoteShared');
        realtimeLog('[Realtime] User channel listener removed', {
          channel: channelName,
          event: '.NoteShared',
        });
      }
      if (typeof onNoteRevoked === 'function') {
        channel.stopListening('.NoteRevoked');
        realtimeLog('[Realtime] User channel listener removed', {
          channel: channelName,
          event: '.NoteRevoked',
        });
      }
    };
  } catch {
    return () => {};
  }
}
