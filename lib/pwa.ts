// lib/pwa.ts
// Client-side only — runs in the browser, never in the service worker

export async function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // Turbopack (Next.js dev server) cannot serve sw.js correctly —
  // skip registration entirely in development to avoid the error.
  // PWA features only activate in production builds.
  if (process.env.NODE_ENV !== 'production') {
    console.log('[PWA] Skipping SW registration in development (Turbopack incompatible)');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered:', registration.scope);

    // Check for updates every 60 seconds
    setInterval(() => registration.update(), 60_000);

    // When a new SW is found, watch its install state
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          showUpdateNotification();
        }
      });
    });

    // Tell the waiting SW to activate immediately when the page reloads
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
  }
}

// Tells a waiting service worker to skip waiting and take control
export function skipWaiting() {
  navigator.serviceWorker.ready.then((registration) => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
  });
}

function showUpdateNotification() {
  // Show an in-app banner instead of push (more reliable cross-browser)
  const event = new CustomEvent('apex:sw-update-available');
  window.dispatchEvent(event);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function onOnline(callback: () => void): () => void {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

export function onOffline(callback: () => void): () => void {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
}

export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

// Capture and return the install prompt event so you can trigger it later
let deferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('apex:install-available'));
  });
}

export async function triggerInstallPrompt(): Promise<'accepted' | 'dismissed' | null> {
  if (!deferredPrompt) return null;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome;
}