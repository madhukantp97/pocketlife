// service-worker.js
// Basic service worker for offline asset caching

const CACHE_NAME = 'pocketlife-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/App.css',
  '/index.css',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/components/PageHeader.tsx',
  '/src/components/NavLink.tsx',
  '/src/components/NotificationCenter.tsx',
  '/src/components/GlobalSearch.tsx',
  '/src/components/FAB.tsx',
  '/src/components/DeleteConfirmDialog.tsx',
  '/src/components/AppSidebar.tsx',
  '/src/components/PasswordStrength.tsx',
  '/src/pages/Dashboard.tsx',
  '/src/pages/NotesScreen.tsx',
  '/src/pages/RemindersScreen.tsx',
  '/src/pages/ImportantDatesScreen.tsx',
  '/src/pages/VaultScreen.tsx',
  '/src/pages/TodoScreen.tsx',
  '/src/pages/DocumentsScreen.tsx',
  '/src/pages/ProfilePage.tsx',
  '/src/pages/SettingsScreen.tsx',
  '/src/pages/CalendarView.tsx',
  '/src/pages/InstallPage.tsx',
  '/src/pages/ResetPassword.tsx',
  '/src/pages/NotFound.tsx',
  // Add more assets as needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});
