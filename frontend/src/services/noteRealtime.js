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
      const url = new URL(proxyTarget, window.location.origin);
      // Docker-internal hostnames are not resolvable by the browser.
      // For local development, routing requests through the dev server proxy (window.location.origin)
      // also avoids potential CORS issues.
      const internalHosts = ['backend-spring', 'backend', 'db', 'nginx', 'localhost', '127.0.0.1'];
      if (internalHosts.includes(url.hostname)) {
        return window.location.origin;
      }
      return url.origin;
    } catch {
      return window.location.origin;
    }
  }

  return window.location.origin;
}

const BROADCAST_AUTH_ENDPOINT = `${resolveBackendOrigin()}/api/broadcasting/auth`;
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

function bindPusherDebugListeners(pusher) {
  const connection = pusher?.connection;

  if (!pusher || !connection) {
    realtimeLog('[Realtime] Pusher debug listeners skipped: connection not available');
    return;
  }

  connection.bind('state_change', (states) => {
    realtimeLog('[Realtime] Pusher state change', {
      previous: states?.previous || null,
      current: states?.current || null,
      socketId: connection.socket_id,
    });
  });

  connection.bind('connected', () => {
    realtimeLog('[Realtime] Pusher connected', {
      socketId: connection.socket_id,
    });
  });

  connection.bind('disconnected', () => {
    realtimeLog('[Realtime] Pusher disconnected', {
      socketId: connection.socket_id,
    });
  });

  connection.bind('error', (error) => {
    realtimeLog('[Realtime] Pusher connection error', {
      socketId: connection.socket_id,
      error,
    });
  });
}

let pusherInstancePromise = null;

async function createPusherInstance() {
  realtimeLog('[Realtime] Creating Pusher instance with:', {
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    authEndpoint: BROADCAST_AUTH_ENDPOINT,
    backendOrigin: resolveBackendOrigin(),
    realtimeDebugEnabled: REALTIME_DEBUG_ENABLED,
  });

  const { default: Pusher } = await import('pusher-js');

  window.Pusher = Pusher;

  const pusherInstance = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    channelAuthorization: {
      customHandler: (params, callback) => {
        fetch(BROADCAST_AUTH_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('auth_token') || ''}`,
          },
          body: JSON.stringify({
            socket_id: params.socketId,
            channel_name: params.channelName,
          }),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => callback(null, data))
          .catch((err) => callback(new Error(err.message), null));
      },
    },
  });

  bindPusherDebugListeners(pusherInstance);

  realtimeLog('[Realtime] Pusher auth bootstrap complete', {
    authEndpoint: BROADCAST_AUTH_ENDPOINT,
    hasAuthToken: Boolean(sessionStorage.getItem('auth_token')),
  });
  realtimeLog('[Realtime] Pusher instance created successfully');
  return pusherInstance;
}

async function getPusherInstance() {
  if (!pusherInstancePromise) {
    pusherInstancePromise = createPusherInstance().catch((error) => {
      console.error('[Realtime] Failed to create Pusher instance:', error);
      pusherInstancePromise = null;
      throw error;
    });
  }

  return pusherInstancePromise;
}

export function getSocketId() {
  return null; // Used externally? Since it's synchronous and we use Promises, it's better to avoid if possible.
}

export async function subscribeToNoteChannel(noteId, onEvent) {
  try {
    const pusher = await getPusherInstance();
    const channelName = `private-note.${noteId}`;
    const channel = pusher.subscribe(channelName);
    
    realtimeLog('[Realtime] Subscribing to note channel', {
      channel: channelName,
      socketId: pusher.connection.socket_id,
      hasHandler: typeof onEvent === 'function',
      authEndpoint: BROADCAST_AUTH_ENDPOINT,
    });
    realtimeLog('[Realtime] Channel object created for note subscription', {
      channel: channelName,
      methods: {
        bind: typeof channel.bind === 'function',
        unbind: typeof channel.unbind === 'function',
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

    const deleteHandler = (payload) => {
      const startedAt = performance.now();
      realtimeLog('[Realtime] Note channel delete event received', {
        channel: channelName,
        event: 'NoteDeleted',
        payload,
      });
      if (typeof onEvent === 'function') {
        onEvent({ isDeleted: true, note: { id: noteId } });
      }
      realtimeLog('[Realtime] NoteDeleted callback finished', {
        channel: channelName,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
      });
    };

    channel.bind('NoteUpdated', handler);
    channel.bind('NoteDeleted', deleteHandler);

    realtimeLog('[Realtime] Listening for NoteUpdated and NoteDeleted', {
      channel: channelName,
    });

    return () => {
      realtimeLog('[Realtime] Unsubscribing from note channel', {
        channel: channelName,
        socketId: pusher.connection.socket_id,
      });
      channel.unbind('NoteUpdated', handler);
      channel.unbind('NoteDeleted', deleteHandler);
      realtimeLog('[Realtime] Note channel listeners removed', {
        channel: channelName,
      });
    };
  } catch (err) {
    console.error(`[Realtime] Failed to subscribe to private-note.${noteId}:`, err);
    return () => {};
  }
}

export async function subscribeToUserChannel(userId, { onNoteShared, onNoteRevoked } = {}) {
  try {
    const pusher = await getPusherInstance();
    const channelName = `private-user.${userId}`;
    const channel = pusher.subscribe(channelName);

    realtimeLog('[Realtime] Subscribing to user channel', {
      channel: channelName,
      socketId: pusher.connection.socket_id,
      listenNoteShared: typeof onNoteShared === 'function',
      listenNoteRevoked: typeof onNoteRevoked === 'function',
      authEndpoint: BROADCAST_AUTH_ENDPOINT,
    });
    realtimeLog('[Realtime] Channel object created for user subscription', {
      channel: channelName,
      methods: {
        bind: typeof channel.bind === 'function',
        unbind: typeof channel.unbind === 'function',
      },
    });

    if (typeof onNoteShared === 'function') {
      channel.bind('NoteShared', (payload) => {
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
        event: 'NoteShared',
      });
    }

    if (typeof onNoteRevoked === 'function') {
      channel.bind('NoteRevoked', (payload) => {
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
        event: 'NoteRevoked',
      });
    }

    return () => {
      realtimeLog('[Realtime] Unsubscribing from user channel', {
        channel: channelName,
        socketId: pusher.connection.socket_id,
      });
      if (typeof onNoteShared === 'function') {
        channel.unbind('NoteShared');
        realtimeLog('[Realtime] User channel listener removed', {
          channel: channelName,
          event: 'NoteShared',
        });
      }
      if (typeof onNoteRevoked === 'function') {
        channel.unbind('NoteRevoked');
        realtimeLog('[Realtime] User channel listener removed', {
          channel: channelName,
          event: 'NoteRevoked',
        });
      }
    };
  } catch {
    return () => {};
  }
}
