interface PasswordStrengthProps {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string; tips: string[] } {
  if (!password) return { score: 0, label: '', color: '', tips: [] };

  let score = 0;
  const tips: string[] = [];

  if (password.length >= 8) score++; else tips.push('At least 8 characters');
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++; else tips.push('Mix upper & lowercase');
  if (/\d/.test(password)) score++; else tips.push('Add a number');
  if (/[^a-zA-Z0-9]/.test(password)) score++; else tips.push('Add a special character');

  if (score <= 1) return { score, label: 'Weak', color: 'bg-destructive', tips };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-warning', tips };
  if (score <= 3) return { score, label: 'Good', color: 'bg-accent', tips };
  return { score, label: 'Strong', color: 'bg-success', tips };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label, color, tips } = getStrength(password);
  if (!password) return null;

  const labelColor = score <= 1 ? 'text-destructive' : score <= 2 ? 'text-warning' : score <= 3 ? 'text-accent' : 'text-success';

  return (
    <div className="mb-3 animate-fade-in">
      {/* Strength bar */}
      <div className="flex gap-1 mb-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= score ? color : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-semibold ${labelColor}`}>{label}</span>
        {tips.length > 0 && (
          <span className="text-[10px] text-muted-foreground">{tips[0]}</span>
        )}
      </div>
    </div>
  );
}
