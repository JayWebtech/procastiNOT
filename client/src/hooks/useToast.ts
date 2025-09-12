import { useToast as useToastContext } from '../components/ui/ToastProvider';

interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const { showToast, hideToast, hideAllToasts } = useToastContext();

  const toast = {
    success: (options: ToastOptions) => {
      showToast({
        type: 'success',
        ...options,
      });
    },

    error: (options: ToastOptions) => {
      showToast({
        type: 'error',
        duration: 7000, // Longer duration for errors
        ...options,
      });
    },

    warning: (options: ToastOptions) => {
      showToast({
        type: 'warning',
        duration: 6000,
        ...options,
      });
    },

    info: (options: ToastOptions) => {
      showToast({
        type: 'info',
        ...options,
      });
    },

    hide: hideToast,
    hideAll: hideAllToasts,
  };

  return toast;
};

// Convenience functions for common use cases
export const showSuccessToast = (title: string, message?: string) => {
  // This would be used in a component with access to the toast context
  console.log('Success toast:', title, message);
};

export const showErrorToast = (title: string, message?: string) => {
  console.log('Error toast:', title, message);
};

export const showWarningToast = (title: string, message?: string) => {
  console.log('Warning toast:', title, message);
};

export const showInfoToast = (title: string, message?: string) => {
  console.log('Info toast:', title, message);
};
