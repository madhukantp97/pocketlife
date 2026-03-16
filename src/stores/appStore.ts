import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { hashPin } from '@/lib/encryption';

interface Note {
  id: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  pinned: boolean | null;
  starred: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Todo {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  completed: boolean | null;
  starred: boolean;
  subtasks: any;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  notified: boolean | null;
  alert_before: number | null;
  starred: boolean;
  created_at: string;
  user_id: string;
}

interface ImportantDate {
  id: string;
  name: string;
  event_type: string;
  date: string;
  notes: string | null;
  created_at: string;
  user_id: string;
}

interface VaultEntry {
  id: string;
  website_name: string;
  username: string | null;
  encrypted_password: string;
  website_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface AppState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  initTheme: () => void;

  vaultUnlocked: boolean;
  masterKey: string;
  unlockVault: (pin: string) => Promise<boolean>;
  lockVault: () => void;
  setMasterPin: (pin: string) => Promise<void>;
  hasMasterPin: () => Promise<boolean>;

  notes: Note[];
  loadNotes: () => Promise<void>;
  addNote: (note: { title: string; content: string; tags: string[]; pinned: boolean }) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  todos: Todo[];
  loadTodos: () => Promise<void>;
  addTodo: (todo: { title: string; description: string; due_date: string | null; priority: string; completed: boolean; subtasks: any[] }) => Promise<void>;
  updateTodo: (id: string, todo: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;

  reminders: Reminder[];
  loadReminders: () => Promise<void>;
  addReminder: (reminder: { title: string; description: string; reminder_date: string; alert_before?: number }) => Promise<void>;
  updateReminder: (id: string, reminder: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  importantDates: ImportantDate[];
  loadImportantDates: () => Promise<void>;
  addImportantDate: (date: { name: string; event_type: string; date: string; notes: string }) => Promise<void>;
  updateImportantDate: (id: string, date: Partial<ImportantDate>) => Promise<void>;
  deleteImportantDate: (id: string) => Promise<void>;

  vaultEntries: VaultEntry[];
  loadVaultEntries: () => Promise<void>;
  addVaultEntry: (entry: { website_name: string; username: string; encrypted_password: string; website_url: string; notes: string }) => Promise<void>;
  updateVaultEntry: (id: string, entry: Partial<VaultEntry>) => Promise<void>;
  deleteVaultEntry: (id: string) => Promise<void>;
}

async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

export const useAppStore = create<AppState>((set, get) => ({
  darkMode: false,
  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('darkMode', String(next));
  },
  initTheme: () => {
    const stored = localStorage.getItem('darkMode');
    const dark = stored === 'true';
    set({ darkMode: dark });
    document.documentElement.classList.toggle('dark', dark);
  },

  vaultUnlocked: false,
  masterKey: '',
  unlockVault: async (pin: string) => {
    const userId = await getUserId();
    if (!userId) return false;
    const { data } = await supabase.from('pocketapp_app_settings').select('value').eq('user_id', userId).eq('key', 'masterPinHash').single();
    if (!data) return false;
    if (hashPin(pin) === data.value) {
      set({ vaultUnlocked: true, masterKey: pin });
      return true;
    }
    return false;
  },
  lockVault: () => set({ vaultUnlocked: false, masterKey: '' }),
  setMasterPin: async (pin: string) => {
    const userId = await getUserId();
    if (!userId) return;
    const hash = hashPin(pin);
    const { data: existing } = await supabase.from('pocketapp_app_settings').select('id').eq('user_id', userId).eq('key', 'masterPinHash').single();
    if (existing) {
      await supabase.from('pocketapp_app_settings').update({ value: hash }).eq('id', existing.id);
    } else {
      await supabase.from('pocketapp_app_settings').insert({ user_id: userId, key: 'masterPinHash', value: hash });
    }
  },
  hasMasterPin: async () => {
    const userId = await getUserId();
    if (!userId) return false;
    const { data } = await supabase.from('pocketapp_app_settings').select('id').eq('user_id', userId).eq('key', 'masterPinHash').single();
    return !!data;
  },

  notes: [],
  loadNotes: async () => {
    let notes = [];
    if (!navigator.onLine) {
      // Offline: load from offlineDB
      const { getAllOffline } = await import('@/lib/offlineDB');
      notes = await getAllOffline('notes');
    } else {
      // Online: load from Supabase
      const { data } = await supabase.from('pocketapp_notes').select('*').order('created_at', { ascending: false });
      notes = data || [];
      // Save to offlineDB
      const { saveOffline } = await import('@/lib/offlineDB');
      for (const note of notes) await saveOffline('notes', note);
    }
    set({ notes });
  },
  addNote: async (note) => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('pocketapp_notes').insert({ ...note, user_id: userId });
    await supabase.from('pocketapp_notifications').insert({ user_id: userId, title: 'Note created', message: `"${note.title}" has been added`, type: 'info' } as any);
    get().loadNotes();
  },
  updateNote: async (id, note) => {
    await supabase.from('pocketapp_notes').update(note).eq('id', id);
    get().loadNotes();
  },
  deleteNote: async (id) => {
    await supabase.from('pocketapp_notes').delete().eq('id', id);
    get().loadNotes();
  },

  todos: [],
  loadTodos: async () => {
    let todos = [];
    if (!navigator.onLine) {
      const { getAllOffline } = await import('@/lib/offlineDB');
      todos = await getAllOffline('todos');
    } else {
      const { data } = await supabase.from('pocketapp_todos').select('*').order('created_at', { ascending: false });
      todos = data || [];
      const { saveOffline } = await import('@/lib/offlineDB');
      for (const todo of todos) await saveOffline('todos', todo);
    }
    set({ todos });
  },
  addTodo: async (todo) => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('pocketapp_todos').insert({ ...todo, user_id: userId });
    await supabase.from('pocketapp_notifications').insert({ user_id: userId, title: 'Task added', message: `"${todo.title}" — ${todo.priority} priority`, type: 'todo' } as any);
    get().loadTodos();
  },
  updateTodo: async (id, todo) => {
    await supabase.from('pocketapp_todos').update(todo).eq('id', id);
    get().loadTodos();
  },
  deleteTodo: async (id) => {
    await supabase.from('pocketapp_todos').delete().eq('id', id);
    get().loadTodos();
  },

  reminders: [],
  loadReminders: async () => {
    let reminders = [];
    if (!navigator.onLine) {
      const { getAllOffline } = await import('@/lib/offlineDB');
      reminders = await getAllOffline('reminders');
    } else {
      const { data } = await supabase.from('pocketapp_reminders').select('*').order('reminder_date', { ascending: true });
      reminders = data || [];
      const { saveOffline } = await import('@/lib/offlineDB');
      for (const reminder of reminders) await saveOffline('reminders', reminder);
    }
    set({ reminders });
  },
  addReminder: async (reminder) => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('pocketapp_reminders').insert({ ...reminder, user_id: userId });
    await supabase.from('pocketapp_notifications').insert({ user_id: userId, title: 'Reminder set', message: `"${reminder.title}"`, type: 'reminder' } as any);
    get().loadReminders();
  },
  updateReminder: async (id, reminder) => {
    await supabase.from('pocketapp_reminders').update(reminder).eq('id', id);
    get().loadReminders();
  },
  deleteReminder: async (id) => {
    await supabase.from('pocketapp_reminders').delete().eq('id', id);
    get().loadReminders();
  },

  importantDates: [],
  loadImportantDates: async () => {
    let importantDates = [];
    if (!navigator.onLine) {
      const { getAllOffline } = await import('@/lib/offlineDB');
      importantDates = await getAllOffline('importantDates');
    } else {
      const { data } = await supabase.from('pocketapp_important_dates').select('*').order('date', { ascending: true });
      importantDates = data || [];
      const { saveOffline } = await import('@/lib/offlineDB');
      for (const date of importantDates) await saveOffline('importantDates', date);
    }
    set({ importantDates });
  },
  addImportantDate: async (date) => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('pocketapp_important_dates').insert({ ...date, user_id: userId });
    get().loadImportantDates();
  },
  updateImportantDate: async (id, date) => {
    await supabase.from('pocketapp_important_dates').update(date).eq('id', id);
    get().loadImportantDates();
  },
  deleteImportantDate: async (id) => {
    await supabase.from('pocketapp_important_dates').delete().eq('id', id);
    get().loadImportantDates();
  },

  vaultEntries: [],
  loadVaultEntries: async () => {
    const { data } = await supabase.from('pocketapp_vault_entries').select('*').order('created_at', { ascending: false });
    set({ vaultEntries: data || [] });
  },
  addVaultEntry: async (entry) => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('pocketapp_vault_entries').insert({ ...entry, user_id: userId });
    get().loadVaultEntries();
  },
  updateVaultEntry: async (id, entry) => {
    await supabase.from('pocketapp_vault_entries').update(entry).eq('id', id);
    get().loadVaultEntries();
  },
  deleteVaultEntry: async (id) => {
    await supabase.from('pocketapp_vault_entries').delete().eq('id', id);
    get().loadVaultEntries();
  },
}));
