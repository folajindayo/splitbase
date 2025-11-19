import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { View, Text, Pressable, Animated, Dimensions } from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  position?: ToastPosition;
  dismissible?: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
  icon?: string;
  progress?: boolean;
  sound?: boolean;
}

interface Toast extends Required<Omit<ToastOptions, 'action' | 'icon'>> {
  id: string;
  action?: ToastOptions['action'];
  icon?: string;
  timestamp: number;
}

interface ToastContextType {
  show: (options: ToastOptions) => string;
  hide: (id: string) => void;
  hideAll: () => void;
  success: (message: string, options?: Partial<ToastOptions>) => string;
  error: (message: string, options?: Partial<ToastOptions>) => string;
  warning: (message: string, options?: Partial<ToastOptions>) => string;
  info: (message: string, options?: Partial<ToastOptions>) => string;
  loading: (message: string, options?: Partial<ToastOptions>) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => Promise<T>;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

let toastCounter = 0;

export const ToastProvider: React.FC<{ children: ReactNode; maxToasts?: number }> = ({
  children,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (options: ToastOptions): string => {
    const id = options.id || `toast-${++toastCounter}`;
    
    const toast: Toast = {
      id,
      type: options.type || 'info',
      title: options.title || '',
      message: options.message,
      duration: options.duration ?? 5000,
      position: options.position || 'top-right',
      dismissible: options.dismissible ?? true,
      progress: options.progress ?? true,
      sound: options.sound ?? false,
      action: options.action,
      icon: options.icon,
      timestamp: Date.now(),
    };

    setToasts(prev => {
      // Remove oldest toast if max limit reached
      const newToasts = prev.length >= maxToasts ? prev.slice(1) : prev;
      // Remove existing toast with same ID
      const filtered = newToasts.filter(t => t.id !== id);
      return [...filtered, toast];
    });

    // Auto dismiss if duration is set
    if (toast.duration > 0 && toast.type !== 'loading') {
      setTimeout(() => hide(id), toast.duration);
    }

    return id;
  };

  const hide = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const hideAll = () => {
    setToasts([]);
  };

  const success = (message: string, options?: Partial<ToastOptions>) =>
    show({ ...options, type: 'success', message });

  const error = (message: string, options?: Partial<ToastOptions>) =>
    show({ ...options, type: 'error', message });

  const warning = (message: string, options?: Partial<ToastOptions>) =>
    show({ ...options, type: 'warning', message });

  const info = (message: string, options?: Partial<ToastOptions>) =>
    show({ ...options, type: 'info', message });

  const loading = (message: string, options?: Partial<ToastOptions>) =>
    show({ ...options, type: 'loading', message, duration: 0 });

  const promise = async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> => {
    const id = loading(messages.loading);
    
    try {
      const result = await promise;
      hide(id);
      success(messages.success);
      return result;
    } catch (error) {
      hide(id);
      throw error;
    }
  };

  const value: ToastContextType = {
    show,
    hide,
    hideAll,
    success,
    error,
    warning,
    info,
    loading,
    promise,
  };

  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    if (!acc[toast.position]) {
      acc[toast.position] = [];
    }
    acc[toast.position].push(toast);
    return acc;
  }, {} as Record<ToastPosition, Toast[]>);

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Render toast containers for each position */}
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <ToastContainer
          key={position}
          position={position as ToastPosition}
          toasts={positionToasts}
          onHide={hide}
        />
      ))}
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  position: ToastPosition;
  toasts: Toast[];
  onHide: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ position, toasts, onHide }) => {
  const getPositionStyles = () => {
    const styles: any = { position: 'absolute', zIndex: 9999 };
    
    if (position.includes('top')) {
      styles.top = 16;
    } else {
      styles.bottom = 16;
    }
    
    if (position.includes('left')) {
      styles.left = 16;
    } else if (position.includes('right')) {
      styles.right = 16;
    } else {
      styles.left = '50%';
      styles.transform = [{ translateX: -150 }]; // Half of typical toast width
    }
    
    return styles;
  };

  return (
    <View style={getPositionStyles()} className="pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </View>
  );
};

interface ToastItemProps {
  toast: Toast;
  onHide: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onHide }) => {
  const [progress, setProgress] = useState(100);
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar
    if (toast.progress && toast.duration > 0 && toast.type !== 'loading') {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
        setProgress(remaining);
        
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, []);

  const handleDismiss = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  };

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-500',
          text: 'text-green-800 dark:text-green-300',
          icon: '✓',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-500',
          text: 'text-red-800 dark:text-red-300',
          icon: '✕',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-500',
          text: 'text-yellow-800 dark:text-yellow-300',
          icon: '⚠',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-500',
          text: 'text-blue-800 dark:text-blue-300',
          icon: 'ℹ',
        };
      case 'loading':
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-400',
          text: 'text-gray-800 dark:text-gray-300',
          icon: '⟳',
        };
      default:
        return {
          bg: 'bg-white dark:bg-gray-800',
          border: 'border-gray-300',
          text: 'text-gray-800 dark:text-gray-300',
          icon: '',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
      }}
      className="pointer-events-auto mb-3"
    >
      <View
        className={`min-w-[300px] max-w-[400px] rounded-lg shadow-lg border-l-4 ${styles.bg} ${styles.border} overflow-hidden`}
      >
        <View className="px-4 py-3">
          <View className="flex-row items-start">
            {/* Icon */}
            {(toast.icon || styles.icon) && (
              <View className="mr-3">
                <Text className={`text-xl ${toast.type === 'loading' ? 'animate-spin' : ''}`}>
                  {toast.icon || styles.icon}
                </Text>
              </View>
            )}

            {/* Content */}
            <View className="flex-1 mr-2">
              {toast.title && (
                <Text className={`font-semibold text-sm mb-1 ${styles.text}`}>
                  {toast.title}
                </Text>
              )}
              <Text className={`text-sm ${styles.text}`}>{toast.message}</Text>
              
              {toast.action && (
                <Pressable
                  onPress={() => {
                    toast.action!.onPress();
                    handleDismiss();
                  }}
                  className="mt-2"
                >
                  <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {toast.action.label}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Dismiss Button */}
            {toast.dismissible && (
              <Pressable onPress={handleDismiss} className="p-1">
                <Text className={`text-lg ${styles.text}`}>×</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        {toast.progress && toast.duration > 0 && toast.type !== 'loading' && (
          <View className="h-1 bg-gray-200 dark:bg-gray-700">
            <View
              className={styles.border.replace('border', 'bg')}
              style={{ width: `${progress}%`, height: '100%' }}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// Standalone toast functions (can be used without provider)
class StandaloneToast {
  private static listeners: Array<(options: ToastOptions) => void> = [];

  static addListener(listener: (options: ToastOptions) => void) {
    this.listeners.push(listener);
  }

  static removeListener(listener: (options: ToastOptions) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  static show(options: ToastOptions) {
    this.listeners.forEach(listener => listener(options));
  }

  static success(message: string, options?: Partial<ToastOptions>) {
    this.show({ ...options, type: 'success', message });
  }

  static error(message: string, options?: Partial<ToastOptions>) {
    this.show({ ...options, type: 'error', message });
  }

  static warning(message: string, options?: Partial<ToastOptions>) {
    this.show({ ...options, type: 'warning', message });
  }

  static info(message: string, options?: Partial<ToastOptions>) {
    this.show({ ...options, type: 'info', message });
  }

  static loading(message: string, options?: Partial<ToastOptions>) {
    this.show({ ...options, type: 'loading', message, duration: 0 });
  }
}

export const toast = StandaloneToast;

// Example Usage
export const ExampleToast = () => {
  const toast = useToast();

  return (
    <View className="flex-1 p-4 items-center justify-center">
      <Pressable
        onPress={() => toast.success('Operation completed successfully!')}
        className="bg-green-600 px-4 py-2 rounded-lg mb-2"
      >
        <Text className="text-white">Show Success</Text>
      </Pressable>
      
      <Pressable
        onPress={() => toast.error('An error occurred!', { duration: 10000 })}
        className="bg-red-600 px-4 py-2 rounded-lg mb-2"
      >
        <Text className="text-white">Show Error</Text>
      </Pressable>
      
      <Pressable
        onPress={() =>
          toast.warning('This is a warning message', {
            action: {
              label: 'Undo',
              onPress: () => console.log('Undo clicked'),
            },
          })
        }
        className="bg-yellow-600 px-4 py-2 rounded-lg mb-2"
      >
        <Text className="text-white">Show Warning with Action</Text>
      </Pressable>
      
      <Pressable
        onPress={() => {
          const promise = new Promise((resolve) => setTimeout(resolve, 2000));
          toast.promise(promise, {
            loading: 'Loading...',
            success: 'Loaded successfully!',
            error: 'Failed to load',
          });
        }}
        className="bg-blue-600 px-4 py-2 rounded-lg"
      >
        <Text className="text-white">Show Promise Toast</Text>
      </Pressable>
    </View>
  );
};
