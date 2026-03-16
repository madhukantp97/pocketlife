import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { CheckSquare, StickyNote, Bell, CalendarHeart, Plus, CalendarDays, X, Check, Trash2, Flag, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, isBefore, addDays } from 'date-fns';
import PageHeader from '@/components/PageHeader';
import { getUpcomingHolidays } from '@/lib/indianHolidays';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { notes, todos, reminders, importantDates, loadNotes, loadTodos, loadReminders, loadImportantDates, updateTodo, deleteReminder } = useAppStore();
  const navigate = useNavigate();
  const [showAgenda, setShowAgenda] = useState(false);

  useEffect(() => {
    loadNotes();
    loadTodos();
    loadReminders();
    loadImportantDates();
  }, []);

  const todayTasks = todos.filter(t => !t.completed && t.due_date && isToday(new Date(t.due_date)));
  const pendingTasks = todos.filter(t => !t.completed).length;
  const upcomingReminders = reminders.filter(r => !r.notified && isBefore(new Date(), new Date(r.reminder_date))).slice(0, 3);
  const upcomingDates = importantDates.filter(d => {
    const eventDate = new Date(d.date);
    const thisYear = new Date(eventDate);
    thisYear.setFullYear(new Date().getFullYear());
    return isBefore(new Date(), addDays(thisYear, 1)) && isBefore(thisYear, addDays(new Date(), 30));
  }).slice(0, 3);
  const recentNotes = notes.slice(0, 3);

  // Agenda: today + tomorrow items
  const isTodayOrTomorrow = (dateStr: string) => {
    const d = new Date(dateStr);
    return isToday(d) || isTomorrow(d);
  };

  const agendaTodos = todos.filter(t => !t.completed && t.due_date && isTodayOrTomorrow(t.due_date));
  const agendaReminders = reminders.filter(r => isTodayOrTomorrow(r.reminder_date));
  const agendaDates = importantDates.filter(d => {
    const eventDate = new Date(d.date);
    const thisYear = new Date(eventDate);
    thisYear.setFullYear(new Date().getFullYear());
    return isToday(thisYear) || isTomorrow(thisYear);
  });

  const agendaTotal = agendaTodos.length + agendaReminders.length + agendaDates.length;

  const dayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM d');
  };

  return (
    <div className="pb-6 animate-fade-in">
      <PageHeader title="Dashboar123d" subtitle={format(new Date(), 'EEEE, MMMM d')} action={
        <button onClick={() => setShowAgenda(true)} className="relative p-2 -mr-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          {agendaTotal > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {agendaTotal > 9 ? '9+' : agendaTotal}
            </span>
          )}
        </button>
      } />

      <div className="grid grid-cols-2 gap-3 px-4 mb-5">
        <StatCard icon={<CheckSquare className="w-4 h-4" />} label="Pending Tasks" value={pendingTasks} onClick={() => navigate('/todos')} />
        <StatCard icon={<StickyNote className="w-4 h-4" />} label="Total Notes" value={notes.length} onClick={() => navigate('/notes')} />
        <StatCard icon={<Bell className="w-4 h-4" />} label="Reminders" value={upcomingReminders.length} onClick={() => navigate('/reminders')} />
        <StatCard icon={<CalendarHeart className="w-4 h-4" />} label="Events" value={importantDates.length} onClick={() => navigate('/dates')} />
      </div>

      <Section title="Today's Tasks" onSeeAll={() => navigate('/todos')}>
        {todayTasks.length === 0 ? (
          <EmptyState text="No tasks due today" />
        ) : (
          todayTasks.map(t => (
            <div key={t.id} className="bg-card rounded-lg p-3 card-shadow">
              <p className="text-sm font-medium text-card-foreground">{t.title}</p>
              <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
                t.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                t.priority === 'medium' ? 'bg-warning/10 text-warning' :
                'bg-muted text-muted-foreground'
              }`}>{t.priority}</span>
            </div>
          ))
        )}
      </Section>

      <Section title="Upcoming Reminders" onSeeAll={() => navigate('/reminders')}>
        {upcomingReminders.length === 0 ? (
          <EmptyState text="No upcoming reminders" />
        ) : (
          upcomingReminders.map(r => (
            <div key={r.id} className="bg-card rounded-lg p-3 card-shadow">
              <p className="text-sm font-medium text-card-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{format(new Date(r.reminder_date), 'MMM d, h:mm a')}</p>
            </div>
          ))
        )}
      </Section>

      <Section title="Recent Notes" onSeeAll={() => navigate('/notes')}>
        {recentNotes.length === 0 ? (
          <EmptyState text="No notes yet" />
        ) : (
          recentNotes.map(n => (
            <div key={n.id} className="bg-card rounded-lg p-3 card-shadow">
              <p className="text-sm font-medium text-card-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
            </div>
          ))
        )}
      </Section>

      <Section title="Upcoming Holidays 🇮🇳" onSeeAll={() => navigate('/calendar')}>
        {(() => {
          const upcoming = getUpcomingHolidays(30);
          if (upcoming.length === 0) return <EmptyState text="No holidays in the next 30 days" />;
          const holidayTypeColors: Record<string, string> = {
            national: 'bg-success/10 text-success',
            religious: 'bg-accent/10 text-accent',
            regional: 'bg-warning/10 text-warning',
          };
          return upcoming.map((h, i) => (
            <div key={i} className="bg-card rounded-lg p-3 card-shadow flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", holidayTypeColors[h.type] || 'bg-success/10 text-success')}>
                {h.type === 'national' ? <Flag className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">{h.name}</p>
                <p className="text-xs text-muted-foreground">{format(h.date, 'MMM d, EEEE')}</p>
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium capitalize", holidayTypeColors[h.type] || 'bg-muted text-muted-foreground')}>
                {h.type}
              </span>
            </div>
          ));
        })()}
      </Section>

      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        <QuickAddBtn label="New Note" onClick={() => navigate('/notes')} />
        <QuickAddBtn label="New Task" onClick={() => navigate('/todos')} />
        <QuickAddBtn label="New Reminder" onClick={() => navigate('/reminders')} />
        <QuickAddBtn label="New Date" onClick={() => navigate('/dates')} />
      </div>

      {/* Agenda Sheet */}
      {showAgenda && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
          <div className="w-full bg-card rounded-t-2xl p-5 card-shadow-lg animate-slide-up max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-card-foreground">📅 Today & Tomorrow</h2>
              <button onClick={() => setShowAgenda(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            {agendaTotal === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Nothing scheduled for today or tomorrow</p>
            ) : (
              <div className="space-y-4">
                {agendaTodos.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" /> Tasks ({agendaTodos.length})
                    </h3>
                    <div className="space-y-2">
                      {agendaTodos.map(t => (
                        <SwipeTodoItem
                          key={t.id}
                          todo={t}
                          dayLabel={dayLabel(t.due_date!)}
                          onComplete={() => updateTodo(t.id, { completed: true })}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {agendaReminders.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" /> Reminders ({agendaReminders.length})
                    </h3>
                    <div className="space-y-2">
                      {agendaReminders.map(r => (
                        <SwipeDeleteItem
                          key={r.id}
                          onDelete={() => deleteReminder(r.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                            <p className="text-[10px] text-primary font-medium mt-0.5">
                              {dayLabel(r.reminder_date)} · {format(new Date(r.reminder_date), 'h:mm a')}
                            </p>
                          </div>
                        </SwipeDeleteItem>
                      ))}
                    </div>
                  </div>
                )}

                {agendaDates.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CalendarHeart className="w-3.5 h-3.5" /> Important Dates ({agendaDates.length})
                    </h3>
                    <div className="space-y-2">
                      {agendaDates.map(d => {
                        const thisYear = new Date(d.date);
                        thisYear.setFullYear(new Date().getFullYear());
                        return (
                          <div key={d.id} className="bg-muted rounded-lg p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-primary font-medium">{isToday(thisYear) ? 'Today' : 'Tomorrow'}</span>
                                <span className="text-[10px] text-muted-foreground capitalize">{d.event_type}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SwipeDeleteItem({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const threshold = -80;

  const onTouchStart = useCallback((e: React.TouchEvent) => { startX.current = e.touches[0].clientX; swiping.current = true; }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    currentX.current = e.touches[0].clientX - startX.current;
    if (currentX.current < 0) setOffset(Math.max(currentX.current, -120));
  }, []);
  const onTouchEnd = useCallback(() => {
    swiping.current = false;
    if (currentX.current < threshold) { setDismissed(true); setOffset(-120); setTimeout(onDelete, 400); }
    else setOffset(0);
    currentX.current = 0;
  }, [onDelete]);
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX; swiping.current = true;
    const onMouseMove = (ev: MouseEvent) => { if (!swiping.current) return; currentX.current = ev.clientX - startX.current; if (currentX.current < 0) setOffset(Math.max(currentX.current, -120)); };
    const onMouseUp = () => { swiping.current = false; if (currentX.current < threshold) { setDismissed(true); setOffset(-120); setTimeout(onDelete, 400); } else setOffset(0); currentX.current = 0; window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
    window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp);
  }, [onDelete]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-destructive flex items-center justify-end pr-4 rounded-lg">
        <Trash2 className="w-4 h-4 text-destructive-foreground" />
        <span className="text-xs text-destructive-foreground font-semibold ml-1">Delete</span>
      </div>
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onMouseDown={onMouseDown}
        className={`relative bg-muted rounded-lg p-3 flex items-center gap-3 select-none cursor-grab active:cursor-grabbing ${dismissed ? 'opacity-50' : ''}`}
        style={{ transform: `translateX(${offset}px)`, transition: swiping.current ? 'none' : 'transform 0.25s ease-out, opacity 0.3s' }}
      >
        {children}
        <span className="text-[10px] text-muted-foreground flex-shrink-0">← swipe</span>
      </div>
    </div>
  );
}

function SwipeTodoItem({ todo, dayLabel, onComplete }: { todo: any; dayLabel: string; onComplete: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const [offset, setOffset] = useState(0);
  const [completed, setCompleted] = useState(false);

  const threshold = -80;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    swiping.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    currentX.current = e.touches[0].clientX - startX.current;
    if (currentX.current < 0) {
      setOffset(Math.max(currentX.current, -120));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    swiping.current = false;
    if (currentX.current < threshold) {
      setCompleted(true);
      setOffset(-120);
      setTimeout(() => { onComplete(); }, 400);
    } else {
      setOffset(0);
    }
    currentX.current = 0;
  }, [onComplete]);

  // Mouse support
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    swiping.current = true;
    const onMouseMove = (ev: MouseEvent) => {
      if (!swiping.current) return;
      currentX.current = ev.clientX - startX.current;
      if (currentX.current < 0) {
        setOffset(Math.max(currentX.current, -120));
      }
    };
    const onMouseUp = () => {
      swiping.current = false;
      if (currentX.current < threshold) {
        setCompleted(true);
        setOffset(-120);
        setTimeout(() => { onComplete(); }, 400);
      } else {
        setOffset(0);
      }
      currentX.current = 0;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [onComplete]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Green background revealed on swipe */}
      <div className="absolute inset-0 bg-green-500 flex items-center justify-end pr-4 rounded-lg">
        <Check className="w-5 h-5 text-white" />
        <span className="text-xs text-white font-semibold ml-1">Done</span>
      </div>
      {/* Swipeable card */}
      <div
        ref={ref}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        className={`relative bg-muted rounded-lg p-3 flex items-center gap-3 select-none cursor-grab active:cursor-grabbing ${completed ? 'opacity-50' : ''}`}
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping.current ? 'none' : 'transform 0.25s ease-out, opacity 0.3s',
        }}
      >
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-foreground truncate ${completed ? 'line-through' : ''}`}>{todo.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-primary font-medium">{dayLabel}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              todo.priority === 'high' ? 'bg-destructive/10 text-destructive' :
              todo.priority === 'medium' ? 'bg-warning/10 text-warning' :
              'bg-secondary text-secondary-foreground'
            }`}>{todo.priority}</span>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">← swipe</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-card rounded-xl p-4 card-shadow text-left active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
    </button>
  );
}

function Section({ title, children, onSeeAll }: { title: string; children: React.ReactNode; onSeeAll: () => void }) {
  return (
    <div className="px-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <button onClick={onSeeAll} className="text-xs text-primary font-medium">See all</button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground py-3 text-center">{text}</p>;
}

function QuickAddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 bg-card rounded-lg p-3 card-shadow text-sm font-medium text-card-foreground active:scale-[0.98] transition-transform">
      <Plus className="w-4 h-4 text-primary" />{label}
    </button>
  );
}
