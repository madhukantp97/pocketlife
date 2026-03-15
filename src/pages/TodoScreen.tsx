import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import PageHeader from '@/components/PageHeader';
import FAB from '@/components/FAB';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { X, Circle, CheckCircle2, Star, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

type Filter = 'all' | 'pending' | 'completed' | 'starred';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export default function TodoScreen() {
  const { todos, loadTodos, addTodo, updateTodo, deleteTodo } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deleteTarget, setDeleteTarget] = useState<typeof todos[0] | null>(null);
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());
  const [newSubtask, setNewSubtask] = useState<Record<string, string>>({});
  const [formSubtasks, setFormSubtasks] = useState<Subtask[]>([]);
  const [formSubtaskInput, setFormSubtaskInput] = useState('');

  useEffect(() => { loadTodos(); }, []);

  const filtered = todos.filter(t => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'starred') return t.starred;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    const prio = { high: 3, medium: 2, low: 1 };
    return (prio[b.priority as keyof typeof prio] || 2) - (prio[a.priority as keyof typeof prio] || 2);
  });

  const resetForm = () => { setTitle(''); setDescription(''); setDueDate(''); setPriority('medium'); setFormSubtasks([]); setFormSubtaskInput(''); setShowForm(false); };

  const handleSave = () => {
    if (!title.trim()) return;
    addTodo({ title, description, due_date: dueDate ? new Date(dueDate).toISOString() : null, priority, completed: false, subtasks: formSubtasks });
    resetForm();
  };

  const addFormSubtask = () => {
    if (!formSubtaskInput.trim()) return;
    setFormSubtasks(prev => [...prev, { id: crypto.randomUUID(), title: formSubtaskInput.trim(), completed: false }]);
    setFormSubtaskInput('');
  };

  const removeFormSubtask = (id: string) => {
    setFormSubtasks(prev => prev.filter(s => s.id !== id));
  };

  const toggleExpanded = (id: string) => {
    setExpandedTodos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getSubtasks = (t: typeof todos[0]): Subtask[] => {
    if (Array.isArray(t.subtasks)) return t.subtasks as Subtask[];
    return [];
  };

  const toggleSubtask = (todo: typeof todos[0], subtaskId: string) => {
    const subtasks = getSubtasks(todo).map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    updateTodo(todo.id, { subtasks });
  };

  const addSubtaskToTodo = (todo: typeof todos[0]) => {
    const text = newSubtask[todo.id]?.trim();
    if (!text) return;
    const subtasks = [...getSubtasks(todo), { id: crypto.randomUUID(), title: text, completed: false }];
    updateTodo(todo.id, { subtasks });
    setNewSubtask(prev => ({ ...prev, [todo.id]: '' }));
  };

  const removeSubtask = (todo: typeof todos[0], subtaskId: string) => {
    const subtasks = getSubtasks(todo).filter(s => s.id !== subtaskId);
    updateTodo(todo.id, { subtasks });
  };

  const priorityColors = {
    high: 'bg-destructive/10 text-destructive',
    medium: 'bg-warning/10 text-warning',
    low: 'bg-muted text-muted-foreground',
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteTodo(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="pb-6 animate-fade-in">
      <PageHeader title="To-Do" subtitle={`${todos.filter(t => !t.completed).length} pending`} />

      <div className="flex gap-2 px-4 mb-4 flex-wrap">
        {(['all', 'pending', 'completed', 'starred'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>{f === 'starred' ? '⭐ Starred' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      <div className="px-4 space-y-2">
        {sorted.map(t => {
          const subtasks = getSubtasks(t);
          const isExpanded = expandedTodos.has(t.id);
          const completedCount = subtasks.filter(s => s.completed).length;

          return (
            <div key={t.id} className={`bg-card rounded-xl card-shadow animate-slide-up ${t.completed ? 'opacity-60' : ''}`}>
              <div className="p-4 flex items-start gap-3">
                <button onClick={() => updateTodo(t.id, { completed: !t.completed })} className="mt-0.5 flex-shrink-0">
                  {t.completed ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-card-foreground ${t.completed ? 'line-through' : ''}`}>{t.title}</p>
                  {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority as keyof typeof priorityColors] || priorityColors.medium}`}>{t.priority}</span>
                    {t.due_date && <span className="text-[10px] text-muted-foreground">{format(new Date(t.due_date), 'MMM d')}</span>}
                    {subtasks.length > 0 && (
                      <button onClick={() => toggleExpanded(t.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        {completedCount}/{subtasks.length} subtasks
                      </button>
                    )}
                    {subtasks.length === 0 && (
                      <button onClick={() => toggleExpanded(t.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                        <Plus className="w-3 h-3" /> Subtask
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => updateTodo(t.id, { starred: !t.starred })} className="p-1">
                    <Star className={`w-4 h-4 ${t.starred ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
                  </button>
                  <button onClick={() => setDeleteTarget(t)} className="text-[10px] text-destructive font-medium">Del</button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-3 pl-12 space-y-1.5 border-t border-border/50 pt-2">
                  {subtasks.map(s => (
                    <div key={s.id} className="flex items-center gap-2 group">
                      <button onClick={() => toggleSubtask(t, s.id)} className="flex-shrink-0">
                        {s.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                      <span className={`text-xs flex-1 ${s.completed ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>{s.title}</span>
                      <button onClick={() => removeSubtask(t, s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      value={newSubtask[t.id] || ''}
                      onChange={e => setNewSubtask(prev => ({ ...prev, [t.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addSubtaskToTodo(t)}
                      placeholder="Add subtask..."
                      className="flex-1 text-xs bg-muted rounded-md px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <button onClick={() => addSubtaskToTodo(t)} className="p-1 text-primary hover:text-primary/80">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No tasks here</p>}
      </div>

      <FAB onClick={() => setShowForm(true)} />

      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
          <div className="w-full bg-card rounded-t-2xl p-5 card-shadow-lg animate-slide-up max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-card-foreground">New Task</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={3} className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none resize-none" />
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-3 bg-muted rounded-lg text-sm text-foreground mb-3 focus:outline-none" />
            <div className="flex gap-2 mb-4">
              {(['low', 'medium', 'high'] as const).map(p => (
                <button key={p} onClick={() => setPriority(p)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  priority === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
              ))}
            </div>

            {/* Subtasks section in form */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Subtasks (optional)</p>
              <div className="space-y-1.5">
                {formSubtasks.map(s => (
                  <div key={s.id} className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                    <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-foreground flex-1">{s.title}</span>
                    <button onClick={() => removeFormSubtask(s.id)} className="p-0.5">
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  value={formSubtaskInput}
                  onChange={e => setFormSubtaskInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFormSubtask())}
                  placeholder="Add a subtask..."
                  className="flex-1 text-xs bg-muted rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button onClick={addFormSubtask} className="p-1.5 text-primary hover:text-primary/80">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button onClick={handleSave} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform">
              Add Task
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isStarred={deleteTarget?.starred}
        itemName={deleteTarget?.title}
      />
    </div>
  );
}
