import { useEffect, useState } from 'react';

function readStoredTheme() {
  const stored = window.localStorage.getItem('theme');
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  return stored || (prefersDark ? 'dark' : 'light');
}

/**
 * Manages the app theme (dark/light).
 * Syncs to localStorage and the <html data-bs-theme> attribute.
 *
 * @returns {{ theme: string, setTheme: Function, toggleTheme: Function }}
 */
export function useTheme() {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  return { theme, setTheme, toggleTheme };
}
