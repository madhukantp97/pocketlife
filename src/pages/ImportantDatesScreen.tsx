import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import PageHeader from '@/components/PageHeader';
import FAB from '@/components/FAB';
import { X, Cake, Heart, Star, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const typeIcons: Record<string, any> = { birthday: Cake, anniversary: Heart, custom: Star };
const typeColors: Record<string, string> = { birthday: 'text-primary', anniversary: 'text-destructive', custom: 'text-accent' };

export default function ImportantDatesScreen() {
  const navigate = useNavigate();
  const { importantDates, loadImportantDates, addImportantDate, deleteImportantDate } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [eventType, setEventType] = useState<'birthday' | 'anniversary' | 'custom'>('birthday');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { loadImportantDates(); }, []);

  const resetForm = () => { setName(''); setEventType('birthday'); setDate(''); setNotes(''); setShowForm(false); };

  const handleSave = () => {
    if (!name.trim() || !date) return;
    addImportantDate({ name, event_type: eventType, date, notes });
    resetForm();
  };

  return (
    <div className="pb-6 animate-fade-in">
      <PageHeader title="Important Dates" subtitle={`${importantDates.length} events`} action={
        <button onClick={() => navigate('/calendar')} className="p-2 -mr-2"><CalendarDays className="w-5 h-5 text-primary" /></button>
      } />

      <div className="px-4 space-y-3">
        {importantDates.map(d => {
          const Icon = typeIcons[d.event_type] || Star;
          const eventDate = new Date(d.date);
          const thisYearDate = new Date(new Date().getFullYear(), eventDate.getMonth(), eventDate.getDate());
          const now = new Date();
          const nextOccurrence = thisYearDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
            ? thisYearDate
            : new Date(now.getFullYear() + 1, eventDate.getMonth(), eventDate.getDate());
          const daysUntil = Math.ceil((nextOccurrence.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isToday = daysUntil === 0;
          const isTomorrow = daysUntil === 1;

          return (
            <div key={d.id} className="bg-card rounded-xl p-4 card-shadow animate-slide-up flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full ${isToday ? 'bg-destructive/10' : 'bg-primary/10'} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${isToday ? 'text-destructive' : typeColors[d.event_type] || 'text-accent'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-card-foreground">{d.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {d.event_type} · {format(eventDate, 'MMMM d')}
                  <span className="text-[10px] ml-1 text-muted-foreground">(repeats yearly)</span>
                </p>
                <p className={`text-[10px] font-medium mt-0.5 ${isToday ? 'text-destructive' : isTomorrow ? 'text-warning' : 'text-primary'}`}>
                  {isToday ? '🎉 Today!' : isTomorrow ? '⏰ Tomorrow' : `${daysUntil} days away`}
                </p>
                {d.notes && <p className="text-xs text-muted-foreground mt-1">{d.notes}</p>}
              </div>
              <button onClick={() => deleteImportantDate(d.id)} className="text-[10px] text-destructive font-medium">Del</button>
            </div>
          );
        })}
        {importantDates.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No important dates yet</p>}
      </div>

      <FAB onClick={() => setShowForm(true)} />

      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
          <div className="w-full bg-card rounded-t-2xl p-5 card-shadow-lg animate-slide-up max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-card-foreground">Add Event</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none" />
            <div className="flex gap-2 mb-3">
              {(['birthday', 'anniversary', 'custom'] as const).map(t => (
                <button key={t} onClick={() => setEventType(t)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors capitalize ${
                  eventType === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>{t}</button>
              ))}
            </div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-muted rounded-lg text-sm text-foreground mb-3 focus:outline-none" />
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-4 focus:outline-none resize-none" />
            <button onClick={handleSave} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform">
              Save Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
