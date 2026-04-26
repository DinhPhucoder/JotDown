import { useEffect, useState } from 'react';

/**
 * Tracks the browser's online/offline status reactively.
 *
 * @returns {boolean} true when the browser is offline
 */
export function useOnlineStatus() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);

    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return isOffline;
}
