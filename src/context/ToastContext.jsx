import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, description, type = 'success', duration = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, title, description, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title, description, duration) => {
    return addToast({ title, description, type: 'success', duration });
  }, [addToast]);

  const error = useCallback((title, description, duration) => {
    return addToast({ title, description, type: 'error', duration });
  }, [addToast]);

  const warning = useCallback((title, description, duration) => {
    return addToast({ title, description, type: 'warning', duration });
  }, [addToast]);

  const info = useCallback((title, description, duration) => {
    return addToast({ title, description, type: 'info', duration });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map(toast => {
            const icons = {
              success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
              error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
              warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
              info: <Info className="w-5 h-5 text-blue-500 shrink-0" />
            };

            const borderColors = {
              success: 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/80',
              error: 'border-rose-500/30 dark:border-rose-500/20 bg-rose-50/90 dark:bg-rose-950/80',
              warning: 'border-amber-500/30 dark:border-amber-500/20 bg-amber-50/90 dark:bg-amber-950/80',
              info: 'border-blue-500/30 dark:border-blue-500/20 bg-blue-50/90 dark:bg-blue-950/80'
            };

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md ${borderColors[toast.type]}`}
              >
                {icons[toast.type]}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {toast.title}
                  </h4>
                  {toast.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
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
