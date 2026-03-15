import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('pocketapp_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data as Notification[]) || []);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('pocketapp_notifications').update({ read: true } as any).in('id', unreadIds);
    loadNotifications();
  };

  const markRead = async (id: string) => {
    await supabase.from('pocketapp_notifications').update({ read: true } as any).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    await supabase.from('pocketapp_notifications').delete().eq('user_id', userId);
    setNotifications([]);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return '🔔';
      case 'todo': return '✅';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-primary font-medium hover:underline">
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-[10px] text-destructive font-medium hover:underline">
                Clear all
              </button>
            )}
          </div>
        </div>
        <div className="max-h-72 overflow-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No notifications</p>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <div className="flex gap-2">
                  <span className="text-sm flex-shrink-0">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{n.message}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(n.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
