// offlineDB.ts
// Handles local storage and sync for offline-first functionality

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'pocketlife_offline';
const DB_VERSION = 1;
const STORE_NAMES = ['notes', 'todos', 'reminders', 'importantDates', 'vaultEntries'];

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      STORE_NAMES.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function saveOffline(store: string, item: any) {
  const db = await getDB();
  await db.put(store, item);
}

export async function getAllOffline(store: string) {
  const db = await getDB();
  return db.getAll(store);
}

export async function queueSync(action: string, store: string, item: any) {
  const db = await getDB();
  await db.add('syncQueue', { action, store, item, timestamp: Date.now() });
}

export async function getSyncQueue() {
  const db = await getDB();
  return db.getAll('syncQueue');
}

export async function clearSyncQueue() {
  const db = await getDB();
  await db.clear('syncQueue');
}
