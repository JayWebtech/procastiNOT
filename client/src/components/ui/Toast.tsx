import { ReactNode, useEffect } from 'react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-500/10 border-green-500/30 bg-gradient-to-r from-green-500/5 to-green-600/5',
          icon: 'text-green-400',
          title: 'text-green-300',
          message: 'text-green-200/80',
          iconContent: '✅'
        };
      case 'error':
        return {
          container: 'bg-red-500/10 border-red-500/30 bg-gradient-to-r from-red-500/5 to-red-600/5',
          icon: 'text-red-400',
          title: 'text-red-300',
          message: 'text-red-200/80',
          iconContent: '❌'
        };
      case 'warning':
        return {
          container: 'bg-yellow-500/10 border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-yellow-600/5',
          icon: 'text-yellow-400',
          title: 'text-yellow-300',
          message: 'text-yellow-200/80',
          iconContent: '⚠️'
        };
      case 'info':
        return {
          container: 'bg-blue-500/10 border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-blue-600/5',
          icon: 'text-blue-400',
          title: 'text-blue-300',
          message: 'text-blue-200/80',
          iconContent: 'ℹ️'
        };
      default:
        return {
          container: 'bg-gray-500/10 border-gray-500/30 bg-gradient-to-r from-gray-500/5 to-gray-600/5',
          icon: 'text-gray-400',
          title: 'text-gray-300',
          message: 'text-gray-200/80',
          iconContent: '📢'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`
        relative overflow-hidden backdrop-blur-sm border rounded-2xl p-4 mb-4
        ${styles.container}
        animate-slide-in-right
        shadow-lg shadow-black/20
        hover:shadow-xl hover:shadow-black/30
        transition-all duration-300 ease-out
        group
      `}
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Content */}
      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${styles.icon}`}>
          {styles.iconContent}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm leading-tight ${styles.title}`}>
            {title}
          </h4>
          {message && (
            <p className={`text-xs mt-1 leading-relaxed ${styles.message}`}>
              {message}
            </p>
          )}
          
          {/* Action Button */}
          {action && (
            <button
              onClick={action.onClick}
              className={`
                mt-2 px-3 py-1 rounded-lg text-xs font-medium
                ${type === 'success' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' :
                  type === 'error' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' :
                  type === 'warning' ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' :
                  'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'}
                transition-colors duration-200
              `}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20">
          <div 
            className={`h-full ${
              type === 'success' ? 'bg-green-400' :
              type === 'error' ? 'bg-red-400' :
              type === 'warning' ? 'bg-yellow-400' :
              'bg-blue-400'
            } animate-progress-bar`}
            style={{ animationDuration: `${duration}ms` }}
          ></div>
        </div>
      )}
    </div>
  );
}
