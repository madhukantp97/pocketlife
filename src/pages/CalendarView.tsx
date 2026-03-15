import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Calendar } from '@/components/ui/calendar';
import PageHeader from '@/components/PageHeader';
import { format, isSameDay } from 'date-fns';
import { Bell, Cake, Heart, Star, ArrowLeft, Flag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { getHolidaysForDate, isHoliday, type IndianHoliday } from '@/lib/indianHolidays';

export default function CalendarView() {
  const { reminders, importantDates, loadReminders, loadImportantDates } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    loadReminders();
    loadImportantDates();
  }, []);

  

  // Get all event dates for highlighting
  const eventDates = new Set<string>();
  reminders.forEach(r => eventDates.add(format(new Date(r.reminder_date), 'yyyy-MM-dd')));
  importantDates.forEach(d => {
    const dt = new Date(d.date);
    const thisYear = new Date(dt);
    thisYear.setFullYear(new Date().getFullYear());
    eventDates.add(format(thisYear, 'yyyy-MM-dd'));
  });

  // Events for selected date
  const selectedReminders = selectedDate
    ? reminders.filter(r => isSameDay(new Date(r.reminder_date), selectedDate))
    : [];

  const selectedDates = selectedDate
    ? importantDates.filter(d => {
        const dt = new Date(d.date);
        const thisYear = new Date(dt);
        thisYear.setFullYear(selectedDate.getFullYear());
        return isSameDay(thisYear, selectedDate);
      })
    : [];

  const selectedHolidays: IndianHoliday[] = selectedDate ? getHolidaysForDate(selectedDate) : [];

  const typeIcons = { birthday: Cake, anniversary: Heart, custom: Star };
  const holidayTypeColors: Record<string, string> = {
    national: 'bg-success/10 text-success',
    religious: 'bg-accent/10 text-accent',
    regional: 'bg-warning/10 text-warning',
  };

  return (
    <div className="pb-6 animate-fade-in">
      <PageHeader
        title="Calendar"
        subtitle="Reminders, Events & Holidays"
        action={
          <button onClick={() => navigate(-1)} className="p-2 -mr-2">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        }
      />

      <div className="px-4 mb-4">
        <div className="bg-card rounded-2xl card-shadow p-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className={cn("p-3 pointer-events-auto")}
            modifiers={{
              hasEvent: (date) => eventDates.has(format(date, 'yyyy-MM-dd')),
              holiday: (date) => isHoliday(date),
            }}
            modifiersStyles={{
              hasEvent: {
                fontWeight: 700,
                textDecoration: 'underline',
                textDecorationColor: 'hsl(36, 95%, 50%)',
                textUnderlineOffset: '3px',
              },
              holiday: {
                fontWeight: 700,
                color: 'hsl(142, 71%, 45%)',
              },
            }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-[10px] text-muted-foreground">Events</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success" />
            <span className="text-[10px] text-muted-foreground">Holidays</span>
          </div>
        </div>
      </div>

      {/* Events for selected date */}
      <div className="px-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
        </h3>

        <div className="space-y-2">
          {/* Indian Holidays */}
          {selectedHolidays.map((h, i) => (
            <div key={`h-${i}`} className="bg-card rounded-xl p-4 card-shadow flex items-start gap-3 animate-slide-up">
              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", holidayTypeColors[h.type] || 'bg-success/10 text-success')}>
                {h.type === 'national' ? <Flag className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{h.name}</p>
                <span className={cn("inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 capitalize", holidayTypeColors[h.type] || 'bg-muted text-muted-foreground')}>
                  {h.type} holiday
                </span>
                {h.description && <p className="text-xs text-muted-foreground mt-1">{h.description}</p>}
              </div>
            </div>
          ))}

          {selectedReminders.map(r => (
            <div key={`r-${r.id}`} className="bg-card rounded-xl p-4 card-shadow flex items-start gap-3 animate-slide-up">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{r.title}</p>
                {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                <p className="text-xs text-primary font-medium mt-1">{format(new Date(r.reminder_date), 'h:mm a')}</p>
              </div>
            </div>
          ))}

          {selectedDates.map(d => {
            const Icon = typeIcons[d.event_type as keyof typeof typeIcons] || Star;
            return (
              <div key={`d-${d.id}`} className="bg-card rounded-xl p-4 card-shadow flex items-start gap-3 animate-slide-up">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{d.event_type}</p>
                  {d.notes && <p className="text-xs text-muted-foreground mt-0.5">{d.notes}</p>}
                </div>
              </div>
            );
          })}

          {selectedReminders.length === 0 && selectedDates.length === 0 && selectedHolidays.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No events on this date</p>
          )}
        </div>
      </div>
    </div>
  );
}
