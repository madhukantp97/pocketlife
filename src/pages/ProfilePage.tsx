import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Camera, User } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pocketapp_profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setDisplayName(data.display_name || '');
      setAvatarUrl(data.avatar_url || '');
    } else {
      // Create profile if it doesn't exist (for users created before trigger)
      await supabase.from('pocketapp_profiles').insert({ id: user.id, display_name: '' });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('pocketapp_profiles')
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setLoading(false);
    if (error) toast.error('Failed to update profile');
    else toast.success('Profile updated!');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;

    await supabase.from('pocketapp_profiles').update({ avatar_url: url }).eq('id', user.id);
    setAvatarUrl(url);
    setUploading(false);
    toast.success('Avatar updated!');
  };

  return (
    <div className="p-4 space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account details" />

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-md">
            <Camera className="w-4 h-4 text-primary-foreground" />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
          {uploading && (
            <div className="absolute inset-0 bg-background/50 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="space-y-3 max-w-sm mx-auto">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-card rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
