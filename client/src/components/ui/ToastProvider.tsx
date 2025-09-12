"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastProps } from './Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: hideToast,
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    showToast,
    hideToast,
    hideAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
          <div className="space-y-2">
            {toasts.map((toast) => (
              <Toast key={toast.id} {...toast} />
            ))}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
