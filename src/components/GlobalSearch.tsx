import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Search, X, StickyNote, CheckSquare, Bell, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  type: 'note' | 'todo' | 'reminder' | 'vault';
  id: string;
  title: string;
  subtitle?: string;
}

export function GlobalSearch() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!query.trim() || !user) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => search(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query, user]);

  const search = async (q: string) => {
    if (!user) return;
    setLoading(true);
    const pattern = `%${q}%`;

    const [notes, todos, reminders, vault] = await Promise.all([
      supabase.from('pocketapp_notes').select('id, title, content').eq('user_id', user.id).or(`title.ilike.${pattern},content.ilike.${pattern}`).limit(5),
      supabase.from('pocketapp_todos').select('id, title, description').eq('user_id', user.id).or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(5),
      supabase.from('pocketapp_reminders').select('id, title, description').eq('user_id', user.id).or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(5),
      supabase.from('pocketapp_vault_entries').select('id, website_name, username').eq('user_id', user.id).or(`website_name.ilike.${pattern},username.ilike.${pattern}`).limit(5),
    ]);

    const items: SearchResult[] = [
      ...(notes.data || []).map(n => ({ type: 'note' as const, id: n.id, title: n.title, subtitle: n.content?.slice(0, 60) })),
      ...(todos.data || []).map(t => ({ type: 'todo' as const, id: t.id, title: t.title, subtitle: t.description?.slice(0, 60) })),
      ...(reminders.data || []).map(r => ({ type: 'reminder' as const, id: r.id, title: r.title, subtitle: r.description?.slice(0, 60) })),
      ...(vault.data || []).map(v => ({ type: 'vault' as const, id: v.id, title: v.website_name, subtitle: v.username || undefined })),
    ];
    setResults(items);
    setLoading(false);
  };

  const iconMap = {
    note: StickyNote,
    todo: CheckSquare,
    reminder: Bell,
    vault: Lock,
  };

  const routeMap = {
    note: '/notes',
    todo: '/todos',
    reminder: '/reminders',
    vault: '/vault',
  };

  const handleSelect = (r: SearchResult) => {
    navigate(routeMap[r.type]);
    setOpen(false);
    setQuery('');
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors">
        <Search className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4" onClick={() => { setOpen(false); setQuery(''); }}>
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search notes, tasks, reminders, vault..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button onClick={() => { setOpen(false); setQuery(''); }}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="max-h-80 overflow-auto">
          {loading && (
            <div className="p-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground text-center">No results found</p>
          )}
          {results.map(r => {
            const Icon = iconMap[r.type];
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{r.type}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
