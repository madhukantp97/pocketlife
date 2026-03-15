import { useAppStore } from '@/stores/appStore';
import PageHeader from '@/components/PageHeader';
import { Moon, Sun, Trash2, Shield, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export default function SettingsScreen() {
  const { darkMode, toggleDarkMode } = useAppStore();
  const [showPinChange, setShowPinChange] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(false);
  const [dailySummaryTime, setDailySummaryTime] = useState('08:00');

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase.from('pocketapp_app_settings').select('key, value').eq('user_id', userId).in('key', ['daily_summary_enabled', 'daily_summary_time']);
    if (data) {
      for (const s of data) {
        if (s.key === 'daily_summary_enabled') setDailySummaryEnabled(s.value === 'true');
        if (s.key === 'daily_summary_time') setDailySummaryTime(s.value);
      }
    }
  };

  const saveSetting = async (key: string, value: string) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data: existing } = await supabase.from('pocketapp_app_settings').select('id').eq('user_id', userId).eq('key', key).single();
    if (existing) {
      await supabase.from('pocketapp_app_settings').update({ value }).eq('id', existing.id);
    } else {
      await supabase.from('pocketapp_app_settings').insert({ user_id: userId, key, value });
    }
  };

  const toggleDailySummary = async () => {
    const next = !dailySummaryEnabled;
    setDailySummaryEnabled(next);
    await saveSetting('daily_summary_enabled', String(next));
    toast.success(next ? 'Daily summary enabled' : 'Daily summary disabled');
  };

  const updateSummaryTime = async (time: string) => {
    setDailySummaryTime(time);
    await saveSetting('daily_summary_time', time);
    toast.success(`Daily summary time set to ${time}`);
  };

  const handleClearAll = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    await Promise.all([
      supabase.from('pocketapp_notes').delete().eq('user_id', userId),
      supabase.from('pocketapp_todos').delete().eq('user_id', userId),
      supabase.from('pocketapp_reminders').delete().eq('user_id', userId),
      supabase.from('pocketapp_important_dates').delete().eq('user_id', userId),
      supabase.from('pocketapp_vault_entries').delete().eq('user_id', userId),
      supabase.from('pocketapp_app_settings').delete().eq('user_id', userId),
      supabase.from('pocketapp_documents').delete().eq('user_id', userId),
    ]);
    toast.success('All data cleared');
    setShowClearConfirm(false);
  };

  const handlePinChange = async () => {
    const { unlockVault, setMasterPin, lockVault } = useAppStore.getState();
    const ok = await unlockVault(oldPin);
    if (!ok) { toast.error('Current PIN is incorrect'); return; }
    if (newPin.length < 4) { toast.error('New PIN must be at least 4 characters'); return; }
    await setMasterPin(newPin);
    lockVault();
    toast.success('Master PIN updated');
    setShowPinChange(false);
    setOldPin('');
    setNewPin('');
  };

  return (
    <div className="pb-6 animate-fade-in">
      <PageHeader title="Settings" />

      <div className="px-4 space-y-3">
        <SettingItem icon={darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />} label={darkMode ? 'Dark Mode' : 'Light Mode'} onClick={toggleDarkMode} />
        <SettingItem icon={<Shield className="w-5 h-5" />} label="Change Master PIN" onClick={() => setShowPinChange(!showPinChange)} />
        {showPinChange && (
          <div className="bg-card rounded-xl p-4 card-shadow space-y-3">
            <input type="password" value={oldPin} onChange={e => setOldPin(e.target.value)} placeholder="Current PIN" className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="New PIN" className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            <button onClick={handlePinChange} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">Update PIN</button>
          </div>
        )}

        <div className="bg-card rounded-xl p-4 card-shadow space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">{dailySummaryEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}</div>
              <span className="text-sm font-medium text-card-foreground">Daily Summary</span>
            </div>
            <button onClick={toggleDailySummary} className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${dailySummaryEnabled ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`w-5 h-5 rounded-full bg-primary-foreground shadow transition-transform ${dailySummaryEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          {dailySummaryEnabled && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted-foreground">Time:</span>
              <input type="time" value={dailySummaryTime} onChange={e => updateSummaryTime(e.target.value)} className="p-2 bg-muted rounded-lg text-sm text-foreground focus:outline-none" />
            </div>
          )}
        </div>

        <SettingItem icon={<Trash2 className="w-5 h-5" />} label="Clear All Data" onClick={() => setShowClearConfirm(true)} destructive />
      </div>

      <div className="px-4 mt-8 text-center">
        <p className="text-xs text-muted-foreground">Productivity App v2.0</p>
        <p className="text-xs text-muted-foreground mt-1">Data stored securely in the cloud</p>
      </div>

      <DeleteConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        onConfirm={handleClearAll}
        itemName="all your data"
      />
    </div>
  );
}

function SettingItem({ icon, label, onClick, destructive }: { icon: React.ReactNode; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button onClick={onClick} className="w-full bg-card rounded-xl p-4 card-shadow flex items-center gap-3 active:scale-[0.99] transition-transform">
      <div className={destructive ? 'text-destructive' : 'text-muted-foreground'}>{icon}</div>
      <span className={`text-sm font-medium ${destructive ? 'text-destructive' : 'text-card-foreground'}`}>{label}</span>
    </button>
  );
}
