import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

type View = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success('Password reset email sent! Check your inbox.');
        setView('login');
      } else if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success('Account created! Check your email to confirm.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error(error.message || 'Google sign-in failed');
    }
  };

  const title = view === 'forgot' ? 'Reset Password' : view === 'login' ? 'Sign in to your account' : 'Create a new account';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Productivity Hub</h1>
      <p className="text-sm text-muted-foreground mb-8">{title}</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full pl-10 pr-4 py-3 bg-card rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            required
          />
        </div>

        {view !== 'forgot' && (
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-3 bg-card rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
        )}

        {view === 'login' && (
          <button type="button" onClick={() => setView('forgot')} className="text-xs text-primary font-medium">
            Forgot password?
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loading ? 'Please wait...' : view === 'forgot' ? 'Send Reset Link' : view === 'login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      {view !== 'forgot' && (
        <>
          <div className="flex items-center gap-3 w-full max-w-sm my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full max-w-sm py-3 bg-card border border-border rounded-xl text-sm font-medium text-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
        </>
      )}

      <button
        onClick={() => setView(view === 'forgot' ? 'login' : view === 'login' ? 'signup' : 'login')}
        className="mt-6 text-sm text-muted-foreground"
      >
        {view === 'forgot' ? (
          <span className="text-primary font-medium">Back to Sign In</span>
        ) : view === 'login' ? (
          <>Don't have an account? <span className="text-primary font-medium">Sign Up</span></>
        ) : (
          <>Already have an account? <span className="text-primary font-medium">Sign In</span></>
        )}
      </button>
    </div>
  );
}
