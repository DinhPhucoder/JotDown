let base = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';
if (base.endsWith('/')) base = base.slice(0, -1);
if (base !== '' && !base.endsWith('/api')) base += '/api';
const API_BASE = base;
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

function getToken() {
  return sessionStorage.getItem('auth_token');
}

function toIsoStringOrNow(value) {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeNoteFromApi(note) {
  const attachments = Array.isArray(note?.attachments) ? note.attachments : [];

  return {
    id: String(note?.id ?? crypto.randomUUID()),
    title: String(note?.title ?? ''),
    content: String(note?.content ?? ''),
    color: typeof note?.color === 'string' && note.color.trim() ? note.color : 'default',
    isPinned: Boolean(note?.is_pinned),
    pinnedAt: note?.pinned_at ? String(note.pinned_at) : undefined,
    isLocked: Boolean(note?.is_protected),
    lockPassword: '',
    labels: Array.isArray(note?.labels) ? note.labels.map(l => String(l?.name || '')) : [],
    images: attachments.map((item) => String(item?.file_url || '')).filter(Boolean),
    attachments,
    sharedWith: Array.isArray(note?.shares)
      ? note.shares.map((s) => ({
          id: s?.id,
          email: s?.receiver?.email,
          permission: s?.permission,
          receiver: s?.receiver,
          sender: s?.sender,
        }))
      : [],
    ownerEmail: note?.user?.email || null,
    ownerName: note?.user?.name || null,
    createdAt: toIsoStringOrNow(note?.created_at),
    updatedAt: toIsoStringOrNow(note?.updated_at),
    version: Number(note?.version || 1),
  };
}

function normalizeColorForApi(color) {
  if (typeof color === 'string' && /^#[0-9A-F]{6}$/i.test(color)) {
    return color;
  }

  return NOTE_COLOR_TO_HEX[color] || '#ffffff';
}

function toApiPayload(note) {
  const payload = {
    title: String(note?.title ?? ''),
    content: String(note?.content ?? ''),
    color: normalizeColorForApi(note?.color),
    is_pinned: Boolean(note?.isPinned),
    is_protected: Boolean(note?.isLocked),
    version: Math.max(Number(note?.version || 1), 1),
  };

  // Chỉ gửi password khi có giá trị (khi đặt khóa mới hoặc đổi mật khẩu)
  if (note?.lockPassword && String(note.lockPassword).trim().length > 0) {
    payload.password = String(note.lockPassword).trim();
  }

  return payload;
}

function toCreateNotePayload(note) {
  const basePayload = toApiPayload({ ...note, version: 1 });
  const attachments = Array.isArray(note?.attachments) ? note.attachments : [];

  if (attachments.length === 0) {
    return basePayload;
  }

  return {
    ...basePayload,
    attachments: attachments
      .filter(Boolean)
      .map((attachment) => ({
        file_url: String(attachment?.file_url || ''),
        file_size: Number(attachment?.file_size || 0),
        file_type: String(attachment?.file_type || ''),
        original_name: attachment?.original_name ? String(attachment.original_name) : null,
      }))
      .filter((attachment) => attachment.file_url && attachment.file_size > 0 && attachment.file_type),
  };
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  const contentType = response.headers.get('content-type') || '';
  const canParseJson = contentType.includes('application/json');
  const data = canParseJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function fetchNotes() {
  const data = await request('/v1/notes');
  return Array.isArray(data) ? data.map(normalizeNoteFromApi) : [];
}

export async function createNoteOnServer(note) {
  const data = await request('/v1/notes', {
    method: 'POST',
    body: JSON.stringify(toCreateNotePayload(note)),
  });

  return normalizeNoteFromApi(data);
}

export async function updateNoteOnServer(noteId, note) {
  try {
    const data = await request(`/v1/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(toApiPayload(note)),
    });
    return normalizeNoteFromApi(data);
  } catch (error) {
    if (error?.status === 409) {
      const conflictError = new Error(error?.payload?.message || 'Conflict detected');
      conflictError.code = 'CONFLICT';
      conflictError.serverNote = normalizeNoteFromApi(error?.payload?.server_note);
      throw conflictError;
    }

    throw error;
  }
}

export async function deleteNoteOnServer(noteId) {
  await request(`/v1/notes/${noteId}`, { method: 'DELETE' });
}

export async function verifyNotePassword(noteId, password) {
  const data = await request(`/v1/notes/${noteId}/verify-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  if (data?.note) {
    data.note = normalizeNoteFromApi(data.note);
  }
  return data;
}

export async function attachLabelsToNoteOnServer(noteId, labelIds) {
  const normalizedLabelIds = Array.isArray(labelIds)
    ? labelIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    : [];

  if (normalizedLabelIds.length === 0) {
    return null;
  }

  return request(`/v1/notes/${noteId}/labels/attach`, {
    method: 'POST',
    body: JSON.stringify({ label_ids: normalizedLabelIds }),
  });
}

export async function detachLabelsFromNoteOnServer(noteId, labelIds) {
  const normalizedLabelIds = Array.isArray(labelIds)
    ? labelIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    : [];

  if (normalizedLabelIds.length === 0) {
    return null;
  }

  return request(`/v1/notes/${noteId}/labels/detach`, {
    method: 'POST',
    body: JSON.stringify({ label_ids: normalizedLabelIds }),
  });
}

export async function pushSyncChanges(changes) {
  const data = await request('/v1/sync/push', {
    method: 'POST',
    body: JSON.stringify({ changes }),
  });

  return {
    successCount: Number(data?.success_count || 0),
    failedCount: Number(data?.failed_count || 0),
    conflicts: Array.isArray(data?.conflicts) ? data.conflicts : [],
  };
}

export async function pullSyncChanges(since) {
  const search = since ? `?since=${encodeURIComponent(since)}` : '';
  const data = await request(`/v1/sync/pull${search}`);

  return {
    notes: Array.isArray(data?.notes) ? data.notes.map(normalizeNoteFromApi) : [],
    deletedIds: Array.isArray(data?.deleted_ids) ? data.deleted_ids.map((id) => String(id)) : [],
    syncedAt: data?.synced_at || new Date().toISOString(),
  };
}

export async function shareNoteOnServer(noteId, email, permission) {
  const data = await request(`/v1/notes/${noteId}/share`, {
    method: 'POST',
    body: JSON.stringify({ email, permission }),
  });
  return data?.data;
}

export async function fetchSharedWithMe() {
  const data = await request('/v1/notes/shared-with-me');
  return Array.isArray(data?.data) ? data.data : [];
}

export async function updateNoteShareOnServer(noteId, shareId, permission) {
  const data = await request(`/v1/notes/${noteId}/shares/${shareId}`, {
    method: 'PUT',
    body: JSON.stringify({ permission }),
  });
  return data?.data;
}

export async function revokeNoteShareOnServer(noteId, shareId) {
  await request(`/v1/notes/${noteId}/shares/${shareId}`, {
    method: 'DELETE',
  });
}

