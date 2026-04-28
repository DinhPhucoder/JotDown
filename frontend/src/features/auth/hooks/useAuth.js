/**
 * useAuth — Single source of truth for authentication state.
 *
 * Reads the persisted session from localStorage and exposes:
 *  - isAuthenticated : boolean — whether the user is logged in
 *  - user            : object | null — basic user data (id, email, displayName)
 *  - login(userData) : void — persist session and update state
 *  - logout()        : void — clear session and redirect
 *
 * NOTE: This is a local-auth implementation (localStorage-based).
 * When the backend is wired up, replace localStorage with real API calls
 * inside authService.js and call them here.
 *
 * @returns {{ isAuthenticated: boolean, user: object|null, login: Function, logout: Function }}
 */
import { useState, useCallback } from 'react';

const SESSION_KEY = 'auth_session';

function readSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState(readSession);

  const login = useCallback((userData) => {
    const session = {
      id: userData.id ?? null,
      email: userData.email ?? '',
      displayName: userData.displayName ?? userData.email ?? 'User',
      isVerified: userData.isVerified ?? false,
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return {
    isAuthenticated: user !== null,
    user,
    login,
    logout,
  };
}
