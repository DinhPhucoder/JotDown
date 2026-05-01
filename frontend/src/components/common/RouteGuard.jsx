import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — Chặn truy cập vào trang cần đăng nhập.
 * Nếu chưa có auth_token → redirect về /login.
 */
export function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * GuestRoute — Chặn user đã đăng nhập vào lại trang login/signup.
 * Nếu đã có auth_token → redirect về /notes.
 */
export function GuestRoute({ children }) {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    return <Navigate to="/notes" replace />;
  }
  return children;
}
