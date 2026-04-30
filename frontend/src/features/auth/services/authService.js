/**
 * authService.js — Centralized API calls for authentication.
 *
 * Base URL reads from VITE_API_URL env variable,
 * falls back to '/api' (proxied by Vite in dev).
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Generic fetch wrapper with JSON handling.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Kiểm tra response có phải JSON không
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  }

  const data = await res.json();

  if (!res.ok) {
    // Laravel validation errors (422) come as { message, errors: { field: [...] } }
    if (res.status === 422 && data.errors) {
      const firstError = Object.values(data.errors).flat()[0];
      throw new Error(firstError || data.message);
    }
    throw new Error(data.message || 'Có lỗi xảy ra');
  }

  return data;
}

// ─── Public Auth ─────────────────────────────────────────────

export async function register({ name, email, password, password_confirmation }) {
  return request('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, password_confirmation }),
  });
}

export async function login({ email, password }) {
  const data = await request('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  // Persist token
  if (data.data?.token) {
    localStorage.setItem('auth_token', data.data.token);
  }
  return data;
}

export async function verifyOtp({ email, otp }) {
  return request('/v1/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export async function forgotPassword({ email }) {
  return request('/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword({ email, otp, password, password_confirmation }) {
  return request('/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, password, password_confirmation }),
  });
}

export async function resendOtp({ email, purpose }) {
  return request('/v1/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email, purpose }),
  });
}

// ─── Protected Auth ──────────────────────────────────────────

export async function logout() {
  const data = await request('/v1/auth/logout', { method: 'POST' });
  localStorage.removeItem('auth_token');
  return data;
}

export async function changePassword({ current_password, password, password_confirmation }) {
  return request('/v1/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, password, password_confirmation }),
  });
}

export async function sendVerifyOtp() {
  return request('/v1/auth/send-verify-otp', { method: 'POST' });
}

export async function sendVerificationLink() {
  return request('/v1/auth/send-verification-link', { method: 'POST' });
}

export async function getUser() {
  return request('/v1/auth/user');
}

export async function updateProfile({ name }) {
  return request('/v1/auth/update-profile', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function updatePreferences(preferences) {
  return request('/v1/auth/update-preferences', {
    method: 'PUT',
    body: JSON.stringify({ preferences }),
  });
}

export async function uploadAvatar(file) {
  const token = localStorage.getItem('auth_token');
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch(`${API_BASE}/v1/auth/upload-avatar`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  }

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 422 && data.errors) {
      const firstError = Object.values(data.errors).flat()[0];
      throw new Error(firstError || data.message);
    }
    throw new Error(data.message || 'Có lỗi xảy ra');
  }

  return data;
}
