const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('auth_token');

  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

function normalizeLabelFromApi(label) {
  return {
    id: String(label?.id ?? ''),
    name: String(label?.name ?? ''),
  };
}

export async function fetchLabels() {
  const response = await fetch(`${API_BASE}/v1/labels`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await parseResponse(response);
  return Array.isArray(data) ? data.map(normalizeLabelFromApi) : [];
}

export async function createLabel(name) {
  const response = await fetch(`${API_BASE}/v1/labels`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name }),
  });

  const data = await parseResponse(response);
  return normalizeLabelFromApi(data);
}

export async function updateLabel(labelId, name) {
  const response = await fetch(`${API_BASE}/v1/labels/${labelId}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name }),
  });

  const data = await parseResponse(response);
  return normalizeLabelFromApi(data);
}

export async function deleteLabel(labelId) {
  const response = await fetch(`${API_BASE}/v1/labels/${labelId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  await parseResponse(response);
}

