import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import PageHeader from '@/components/PageHeader';
import FAB from '@/components/FAB';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { X, Bell, CalendarDays, Star } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const ALERT_OPTIONS = [
  { value: 0, label: 'At time' },
  { value: 5, label: '5 min before' },
  { value: 10, label: '10 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export default function RemindersScreen() {
  const navigate = useNavigate();
  const { reminders, loadReminders, addReminder, updateReminder, deleteReminder } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [alertBefore, setAlertBefore] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<typeof reminders[0] | null>(null);

  useEffect(() => { loadReminders(); }, []);

  const upcoming = reminders.filter(r => !isBefore(new Date(r.reminder_date), new Date()));
  const past = reminders.filter(r => isBefore(new Date(r.reminder_date), new Date()));

  const resetForm = () => { setTitle(''); setDescription(''); setDate(''); setTime(''); setAlertBefore(0); setShowForm(false); };

  const handleSave = () => {
    if (!title.trim() || !date || !time) return;
    const reminderDate = new Date(`${date}T${time}`);
    addReminder({ title, description, reminder_date: reminderDate.toISOString(), alert_before: alertBefore });

    if ('Notification' in window && Notification.permission === 'granted') {
      const alertTime = reminderDate.getTime() - alertBefore * 60 * 1000;
      const delay = alertTime - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          new Notification(title, { body: description || 'Reminder!' });
        }, delay);
      }
    }
    resetForm();
  };

  useEffect(() => {
    if ('Notification' in window) Notification.requestPermission();
  }, []);

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteReminder(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const ReminderCard = ({ r, isPast }: { r: typeof reminders[0]; isPast?: boolean }) => (
    <div className={`bg-card rounded-xl p-4 card-shadow animate-slide-up flex items-start gap-3 ${isPast ? 'opacity-50' : ''}`}>
      <div className={`w-10 h-10 rounded-full ${isPast ? 'bg-muted' : 'bg-primary/10'} flex items-center justify-center flex-shrink-0`}>
        <Bell className={`w-4 h-4 ${isPast ? 'text-muted-foreground' : 'text-primary'}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-card-foreground">{r.title}</p>
        {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
        <p className="text-xs text-primary font-medium mt-1">{format(new Date(r.reminder_date), 'MMM d, yyyy · h:mm a')}</p>
        {(r as any).alert_before > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            🔔 Alert {ALERT_OPTIONS.find(o => o.value === (r as any).alert_before)?.label || `${(r as any).alert_before} min before`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => updateReminder(r.id, { starred: !(r as any).starred } as any)} className="p-1">
          <Star className={`w-4 h-4 ${(r as any).starred ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
        </button>
        <button onClick={() => setDeleteTarget(r)} className="text-[10px] text-destructive font-medium">Del</button>
      </div>
    </div>
  );

  return (
    <div className="pb-6 animate-fade-in">
      <PageHeader title="Reminders" subtitle={`${upcoming.length} upcoming`} action={
        <button onClick={() => navigate('/calendar')} className="p-2 -mr-2"><CalendarDays className="w-5 h-5 text-primary" /></button>
      } />

      <div className="px-4 space-y-3">
        {upcoming.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</h3>
            {upcoming.map(r => <ReminderCard key={r.id} r={r} />)}
          </>
        )}
        {past.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Past</h3>
            {past.map(r => <ReminderCard key={r.id} r={r} isPast />)}
          </>
        )}
        {reminders.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No reminders yet</p>}
      </div>

      <FAB onClick={() => setShowForm(true)} />

      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
          <div className="w-full bg-card rounded-t-2xl p-5 card-shadow-lg animate-slide-up max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-card-foreground">New Reminder</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reminder title" className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none resize-none" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none" />
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="p-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">🔔 Alert timing</label>
              <div className="flex flex-wrap gap-2">
                {ALERT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setAlertBefore(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${alertBefore === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSave} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform">
              Set Reminder
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isStarred={(deleteTarget as any)?.starred}
        itemName={deleteTarget?.title}
      />
    </div>
  );
}
