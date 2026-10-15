import React from 'react';
import { Inbox, AlertCircle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0B132B]/50 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-3">
        {icon || <Inbox className="w-6 h-6 text-slate-400 dark:text-slate-500" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 font-sans">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed font-sans">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Memuat data sistem...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <RefreshCw className="w-6 h-6 text-blue-600 dark:text-cyan-400 animate-spin mb-3" />
      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{message}</span>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Gagal Memuat Data',
  message,
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-1">{title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mb-4 font-sans">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Coba Lagi
        </button>
      )}
    </div>
  );
};
