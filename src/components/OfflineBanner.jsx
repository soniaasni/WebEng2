import { useState, useEffect } from 'react';

async function checkOnline() {
  if (!navigator.onLine) return false;
  try {
    // Timestamp-URL → nie im SW-Cache → echter Netzwerktest
    await fetch(`/?_check=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    return true;
  } catch {
    return false;
  }
}

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);

    // Nachladen-Fix: nach Mount nochmal prüfen (DevTools offline)
    checkOnline().then(online => setIsOffline(!online));

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      Keine Internetverbindung – die App läuft im Offline-Modus
    </div>
  );
}
