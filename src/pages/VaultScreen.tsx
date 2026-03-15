import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { encrypt, decrypt } from '@/lib/encryption';
import PageHeader from '@/components/PageHeader';
import FAB from '@/components/FAB';
import PasswordStrength from '@/components/PasswordStrength';
import { X, Eye, EyeOff, Copy, ExternalLink, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function VaultScreen() {
  const { vaultUnlocked, masterKey, unlockVault, lockVault, hasMasterPin, setMasterPin, vaultEntries, loadVaultEntries, addVaultEntry, deleteVaultEntry } = useAppStore();
  const [pin, setPin] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [websiteName, setWebsiteName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  useEffect(() => {
    hasMasterPin().then(has => setNeedsSetup(!has));
  }, []);

  useEffect(() => {
    if (vaultUnlocked) loadVaultEntries();
  }, [vaultUnlocked]);

  const handleSetup = async () => {
    if (pin.length < 4) { toast.error('PIN must be at least 4 characters'); return; }
    if (pin !== confirmPin) { toast.error('PINs do not match'); return; }
    await setMasterPin(pin);
    await unlockVault(pin);
    setPin('');
    setConfirmPin('');
    setNeedsSetup(false);
  };

  const handleUnlock = async () => {
    const success = await unlockVault(pin);
    if (!success) toast.error('Incorrect PIN');
    setPin('');
  };

  const resetForm = () => { setWebsiteName(''); setUsername(''); setPassword(''); setWebsiteUrl(''); setNotes(''); setShowForm(false); };

  const handleSave = () => {
    if (!websiteName.trim() || !password.trim()) return;
    const encryptedPassword = encrypt(password, masterKey);
    addVaultEntry({ website_name: websiteName, username, encrypted_password: encryptedPassword, website_url: websiteUrl, notes });
    resetForm();
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyPassword = (encrypted: string) => {
    const decrypted = decrypt(encrypted, masterKey);
    navigator.clipboard.writeText(decrypted);
    toast.success('Password copied');
  };

  if (!vaultUnlocked) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-vault flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-vault-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">{needsSetup ? 'Set Up Vault' : 'Unlock Vault'}</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">{needsSetup ? 'Create a master PIN to secure your passwords' : 'Enter your master PIN'}</p>
        <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder={needsSetup ? 'Create PIN (4+ chars)' : 'Enter PIN'}
          className="w-full max-w-xs p-3 bg-card rounded-xl border border-border text-sm text-center text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
          onKeyDown={e => e.key === 'Enter' && !needsSetup && handleUnlock()} />
        {needsSetup && (
          <input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} placeholder="Confirm PIN"
            className="w-full max-w-xs p-3 bg-card rounded-xl border border-border text-sm text-center text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        )}
        <button onClick={needsSetup ? handleSetup : handleUnlock} className="w-full max-w-xs py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm mt-2 active:scale-[0.98] transition-transform">
          {needsSetup ? 'Create PIN' : 'Unlock'}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-6 animate-fade-in">
      <PageHeader title="Password Vault" subtitle={`${vaultEntries.length} saved`} action={
        <button onClick={lockVault} className="text-xs text-primary font-medium flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Lock
        </button>
      } />

      <div className="px-4 space-y-3">
        {vaultEntries.map(entry => (
          <div key={entry.id} className="bg-card rounded-xl p-4 card-shadow animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-card-foreground">{entry.website_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{entry.username}</p>
              </div>
              <button onClick={() => deleteVaultEntry(entry.id)} className="text-[10px] text-destructive font-medium">Del</button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2 font-mono text-xs text-foreground">
                {visiblePasswords.has(entry.id) ? decrypt(entry.encrypted_password, masterKey) : '••••••••••'}
              </div>
              <button onClick={() => togglePasswordVisibility(entry.id)} className="p-2 bg-muted rounded-lg">
                {visiblePasswords.has(entry.id) ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
              </button>
              <button onClick={() => copyPassword(entry.encrypted_password)} className="p-2 bg-muted rounded-lg">
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
              {entry.website_url && (
                <a href={entry.website_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-muted rounded-lg">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>
        ))}
        {vaultEntries.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No passwords saved yet</p>}
      </div>

      <FAB onClick={() => setShowForm(true)} />

      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
          <div className="w-full bg-card rounded-t-2xl p-5 card-shadow-lg animate-slide-up max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-card-foreground">Add Password</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <input value={websiteName} onChange={e => setWebsiteName(e.target.value)} placeholder="Website / Service" className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none" />
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username / Email" className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-2 focus:outline-none" />
            <PasswordStrength password={password} />
            <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="Website URL (optional)" className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none" />
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-4 focus:outline-none resize-none" />
            <button onClick={handleSave} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform">
              Save Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
