const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('auth_token');

  return {
    Accept: 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...extraHeaders,
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 422 && data.errors) {
      const firstError = Object.values(data.errors).flat()[0];
      throw new Error(firstError || data.message);
    }

    throw new Error(data.message || 'Có lỗi xảy ra.');
  }

  return data;
}

export async function getNoteAttachmentSignature(noteId) {
  const response = await fetch(`${API_BASE}/v1/notes/${noteId}/attachments/signature`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await parseResponse(response);
  return data.data;
}

export async function getAttachmentSignature() {
  const response = await fetch(`${API_BASE}/v1/attachments/signature`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await parseResponse(response);
  return data.data;
}

export async function saveNoteAttachment(noteId, payload) {
  const response = await fetch(`${API_BASE}/v1/notes/${noteId}/attachments`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response);
  return data.data;
}

export async function deleteNoteAttachment(noteId, attachmentId) {
  const response = await fetch(`${API_BASE}/v1/notes/${noteId}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  await parseResponse(response);
}

export async function uploadImageToCloudinary(file, signaturePayload) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signaturePayload.api_key);
  formData.append('timestamp', String(signaturePayload.timestamp));
  formData.append('signature', signaturePayload.signature);
  formData.append('folder', signaturePayload.folder);

  const response = await fetch(signaturePayload.upload_url, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Upload ảnh lên Cloudinary thất bại.');
  }

  return data;
}
