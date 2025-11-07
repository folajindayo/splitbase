/**
 * In-App Notification System
 * Toast notifications and alerts for user feedback
 */

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // milliseconds, 0 for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

type NotificationListener = (notifications: Notification[]) => void;

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: Set<NotificationListener> = new Set();
  private nextId = 1;

  subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    listener(this.notifications);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.notifications]));
  }

  private add(notification: Omit<Notification, "id">) {
    const id = `notification-${this.nextId++}`;
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    };

    this.notifications.push(newNotification);
    this.notify();

    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => this.remove(id), newNotification.duration);
    }

    return id;
  }

  remove(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  removeAll() {
    this.notifications = [];
    this.notify();
  }

  // Convenience methods
  success(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: "success", title, message, ...options });
  }

  error(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: "error", title, message, duration: 7000, ...options });
  }

  warning(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: "warning", title, message, ...options });
  }

  info(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: "info", title, message, ...options });
  }
}

export const notificationManager = new NotificationManager();

// Convenience exports
export const showSuccess = (title: string, message: string, options?: Partial<Notification>) =>
  notificationManager.success(title, message, options);

export const showError = (title: string, message: string, options?: Partial<Notification>) =>
  notificationManager.error(title, message, options);

export const showWarning = (title: string, message: string, options?: Partial<Notification>) =>
  notificationManager.warning(title, message, options);

export const showInfo = (title: string, message: string, options?: Partial<Notification>) =>
  notificationManager.info(title, message, options);

// Common notification messages
export const NotificationMessages = {
  // Escrow Created
  escrowCreated: (escrowId: string) => ({
    title: "Escrow Created",
    message: `Your escrow has been created successfully. ID: ${escrowId.slice(0, 8)}...`,
  }),

  // Funding
  fundingDetected: (amount: number) => ({
    title: "Funding Detected",
    message: `We've detected ${amount} ETH in the custody wallet. Processing...`,
  }),

  escrowFunded: (amount: number) => ({
    title: "Escrow Funded",
    message: `Your escrow is now funded with ${amount} ETH. Ready for release.`,
  }),

  // Release
  fundsReleasing: () => ({
    title: "Releasing Funds",
    message: "Processing transaction... This may take 1-3 minutes.",
  }),

  fundsReleased: (amount: number) => ({
    title: "Funds Released",
    message: `Successfully released ${amount} ETH to the seller.`,
  }),

  milestoneReleased: (milestone: string, amount: number) => ({
    title: "Milestone Released",
    message: `"${milestone}" completed. Released ${amount} ETH.`,
  }),

  // Refund
  refundProcessing: () => ({
    title: "Processing Refund",
    message: "Refunding your funds... This may take 1-3 minutes.",
  }),

  refundComplete: (amount: number) => ({
    title: "Refund Complete",
    message: `Successfully refunded ${amount} ETH to your wallet.`,
  }),

  // Errors
  insufficientFunds: () => ({
    title: "Insufficient Funds",
    message: "The custody wallet doesn't have enough balance for this operation.",
  }),

  transactionFailed: (reason?: string) => ({
    title: "Transaction Failed",
    message: reason || "The transaction failed. Please try again.",
  }),

  networkError: () => ({
    title: "Network Error",
    message: "Unable to connect to the network. Please check your connection.",
  }),

  // Wallet
  walletConnected: (address: string) => ({
    title: "Wallet Connected",
    message: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
  }),

  walletDisconnected: () => ({
    title: "Wallet Disconnected",
    message: "Your wallet has been disconnected.",
  }),

  // Generic
  copySuccess: () => ({
    title: "Copied",
    message: "Address copied to clipboard.",
  }),

  saveSuccess: () => ({
    title: "Saved",
    message: "Your changes have been saved successfully.",
  }),

  deleteSuccess: () => ({
    title: "Deleted",
    message: "Item deleted successfully.",
  }),

  // Warnings
  pendingTransaction: () => ({
    title: "Transaction Pending",
    message: "Please wait for the current transaction to complete.",
  }),

  confirmAction: () => ({
    title: "Confirm Action",
    message: "Please confirm this action in your wallet.",
  }),
};

// Hook for React components
export function useNotifications() {
  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    manager: notificationManager,
  };
}

