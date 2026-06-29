import { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════ 
// Prüfe echte Netzwerkverbindung (nicht nur navigator.onLine)
// ═══════════════════════════════════════════════════════════ 
// navigator.onLine kann falsch sein, wenn Service Worker cached
// Dieser Fetch mit Timestamp-Parameter wird garantiert nicht vom 
// Service Worker gecacht → echter Netzwerktest
async function checkOnline() {
  if (!navigator.onLine) return false; // Schneller Check zuerst
  try {
    // HEAD-Request mit Timestamp → wird niemals gecacht
    // cache: 'no-store' verhindert auch Browser-Cache
    await fetch(`/?_check=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    return true;
  } catch {
    return false; // Netzwerk-Fehler → offline
  }
}

// ═══════════════════════════════════════════════════════════ 
// OfflineBanner: Zeigt Meldung wenn keine Internetverbindung
// ═══════════════════════════════════════════════════════════ 
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Listener für online/offline Events
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);

    // Nach dem Mount: echte Netzwerk-Prüfung durchführen
    // (browser.onLine kann bei DevTools offline Mode falsch sein)
    checkOnline().then(online => setIsOffline(!online));

    // Aufräumen: Listener entfernen
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  // Zeige Banner nur wenn offline
  if (!isOffline) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      Keine Internetverbindung – die App läuft im Offline-Modus
    </div>
  );
}