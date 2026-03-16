// network.ts
// Detects online/offline status and triggers sync

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onNetworkChange(callback: (online: boolean) => void) {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
}
