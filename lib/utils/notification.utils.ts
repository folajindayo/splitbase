/**
 * Notification Utilities
 */

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

class NotificationManager {
  private listeners: Set<(notification: Notification) => void> = new Set();

  subscribe(listener: (notification: Notification) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(type: Notification['type'], message: string) {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now(),
    };

    this.listeners.forEach((listener) => listener(notification));
  }

  success(message: string) {
    this.notify('success', message);
  }

  error(message: string) {
    this.notify('error', message);
  }

  info(message: string) {
    this.notify('info', message);
  }

  warning(message: string) {
    this.notify('warning', message);
  }
}

export const notifications = new NotificationManager();

