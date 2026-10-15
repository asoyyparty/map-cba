import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle } from 'lucide-react';

export type EnterpriseStatus = 
  | 'online' | 'offline' | 'warning' | 'info' | 'unknown' 
  | 'active' | 'normal' | 'critical' | 'resolved' | 'open' | 'healthy' | 'up' | 'down';

interface StatusBadgeProps {
  status: EnterpriseStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  label?: string;
  pulsing?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  label,
  pulsing,
  className = ''
}) => {
  const normalized = (status || '').toLowerCase();

  let variant: 'online' | 'offline' | 'warning' | 'info' | 'unknown' = 'unknown';

  if (['online', 'active', 'normal', 'resolved', 'healthy', 'up'].includes(normalized)) {
    variant = 'online';
  } else if (['offline', 'critical', 'down', 'error'].includes(normalized)) {
    variant = 'offline';
  } else if (['warning', 'open', 'degraded'].includes(normalized)) {
    variant = 'warning';
  } else if (['info', 'information', 'maintenance'].includes(normalized)) {
    variant = 'info';
  }

  const styles = {
    online: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30 dark:border-emerald-500/30',
      dot: 'bg-emerald-500 dark:bg-emerald-400',
      icon: CheckCircle2,
      defaultLabel: 'ONLINE'
    },
    offline: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/10',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-500/30 dark:border-rose-500/30',
      dot: 'bg-rose-500 dark:bg-rose-400',
      icon: XCircle,
      defaultLabel: 'OFFLINE'
    },
    warning: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/10',
      text: 'text-amber-800 dark:text-amber-400',
      border: 'border-amber-500/30 dark:border-amber-500/30',
      dot: 'bg-amber-500 dark:bg-amber-400',
      icon: AlertTriangle,
      defaultLabel: 'WARNING'
    },
    info: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/10',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500/30 dark:border-blue-500/30',
      dot: 'bg-blue-500 dark:bg-blue-400',
      icon: Info,
      defaultLabel: 'INFO'
    },
    unknown: {
      bg: 'bg-slate-500/10 dark:bg-slate-500/10',
      text: 'text-slate-700 dark:text-slate-400',
      border: 'border-slate-500/30 dark:border-slate-500/30',
      dot: 'bg-slate-500 dark:bg-slate-400',
      icon: HelpCircle,
      defaultLabel: 'UNKNOWN'
    }
  }[variant];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2 font-semibold'
  }[size];

  const IconComponent = styles.icon;
  const isPulsing = pulsing !== undefined ? pulsing : (variant === 'warning' || variant === 'offline');

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-md border tracking-wider uppercase transition-colors select-none ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses} ${className}`}
    >
      {showIcon && (
        <span className="relative flex items-center justify-center shrink-0">
          <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          {isPulsing && (
            <span
              className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${styles.dot} animate-ping opacity-75`}
            />
          )}
        </span>
      )}
      <span>{label || (status ? status.toUpperCase() : styles.defaultLabel)}</span>
    </span>
  );
};
