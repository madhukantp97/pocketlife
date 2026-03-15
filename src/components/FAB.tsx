import { Plus } from 'lucide-react';

export interface FABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  as?: 'button' | 'div';
}

export default function FAB({ onClick, icon, disabled, as = 'button' }: FABProps) {
  const className = "fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center fab-shadow active:scale-95 transition-transform cursor-pointer";
  if (as === 'div') {
    return <div className={className}>{icon || <Plus className="w-6 h-6" />}</div>;
  }
  return (
    <button onClick={onClick} disabled={disabled} className={className}>
      {icon || <Plus className="w-6 h-6" />}
    </button>
  );
}
