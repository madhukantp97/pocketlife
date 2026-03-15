import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-20 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6 fab-shadow">
        <Smartphone className="w-10 h-10 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Install App</h1>
      <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
        Install this app on your device for a native experience with offline support.
      </p>

      {installed ? (
        <p className="text-sm text-success font-medium">✓ App installed successfully!</p>
      ) : deferredPrompt ? (
        <button onClick={handleInstall} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform fab-shadow">
          <Download className="w-5 h-5" /> Install Now
        </button>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">To install on your device:</p>
          <div className="bg-card rounded-xl p-4 card-shadow text-left space-y-2 text-sm text-card-foreground">
            <p><strong>iOS:</strong> Tap Share → "Add to Home Screen"</p>
            <p><strong>Android:</strong> Tap ⋮ menu → "Add to Home Screen"</p>
            <p><strong>Desktop:</strong> Click the install icon in the address bar</p>
          </div>
        </div>
      )}
    </div>
  );
}
