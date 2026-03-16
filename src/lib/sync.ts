// sync.ts
// Handles syncing queued data to server when online

import { getSyncQueue, clearSyncQueue } from './offlineDB';
import { supabase } from '@/integrations/supabase/client';

export async function syncQueuedData() {
  const queue = await getSyncQueue();
  for (const entry of queue) {
    const { action, store, item } = entry;
    let table = '';
    switch (store) {
      case 'notes': table = 'pocketapp_notes'; break;
      case 'todos': table = 'pocketapp_todos'; break;
      case 'reminders': table = 'pocketapp_reminders'; break;
      case 'importantDates': table = 'pocketapp_important_dates'; break;
      case 'vaultEntries': table = 'pocketapp_vault_entries'; break;
      default: continue;
    }
    try {
      if (action === 'add') {
        await supabase.from(table).insert(item);
      } else if (action === 'update') {
        await supabase.from(table).update(item).eq('id', item.id);
      } else if (action === 'delete') {
        await supabase.from(table).delete().eq('id', item.id);
      }
    } catch (e) {
      // Optionally log or retry
      continue;
    }
  }
  await clearSyncQueue();
}
