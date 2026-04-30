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
    const update = () => {
      const nextIsOffline = !navigator.onLine;

      setIsOffline((currentIsOffline) =>
        currentIsOffline === nextIsOffline ? currentIsOffline : nextIsOffline,
      );
    };

    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);

    const pollingId = window.setInterval(update, 2000);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
      window.clearInterval(pollingId);
    };
  }, []);

  return isOffline;
}
