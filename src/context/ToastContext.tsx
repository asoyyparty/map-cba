import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', title?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, type, title, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none">
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-3 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-2.5 transition-all animate-in slide-in-from-top-2 ${
                isSuccess
                  ? 'bg-[#0B132B]/95 border-emerald-500/40 text-slate-200'
                  : isError
                  ? 'bg-[#0B132B]/95 border-rose-500/40 text-slate-200'
                  : isWarning
                  ? 'bg-[#0B132B]/95 border-amber-500/40 text-slate-200'
                  : 'bg-[#0B132B]/95 border-blue-500/40 text-slate-200'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {isInfo && <Info className="w-4 h-4 text-blue-400" />}
              </div>

              <div className="flex-1 text-xs">
                {toast.title && <div className="font-semibold text-slate-100 mb-0.5 font-sans">{toast.title}</div>}
                <div className="text-slate-300 font-sans leading-relaxed text-[11px]">{toast.message}</div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-slate-500 hover:text-slate-300 rounded transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
