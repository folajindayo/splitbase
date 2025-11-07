/**
 * Keyboard Shortcuts System
 * Handle keyboard shortcuts throughout the application
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
}

type ShortcutMap = Map<string, KeyboardShortcut>;

class KeyboardShortcutManager {
  private shortcuts: ShortcutMap = new Map();
  private listener: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Register a keyboard shortcut
   */
  register(id: string, shortcut: KeyboardShortcut) {
    this.shortcuts.set(id, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(id: string) {
    this.shortcuts.delete(id);
  }

  /**
   * Get shortcut key combination as string
   */
  private getKeyString(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey) parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");
    if (e.metaKey) parts.push("meta");
    parts.push(e.key.toLowerCase());
    return parts.join("+");
  }

  /**
   * Match shortcut to key combination
   */
  private matchesShortcut(e: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) return false;
    if (shortcut.ctrl && !e.ctrlKey) return false;
    if (shortcut.shift && !e.shiftKey) return false;
    if (shortcut.alt && !e.altKey) return false;
    if (shortcut.meta && !e.metaKey) return false;
    return true;
  }

  /**
   * Start listening for keyboard shortcuts
   */
  enable() {
    if (this.listener) return;

    this.listener = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Find matching shortcut
      for (const [id, shortcut] of this.shortcuts.entries()) {
        if (shortcut.enabled !== false && this.matchesShortcut(e, shortcut)) {
          e.preventDefault();
          e.stopPropagation();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener("keydown", this.listener);
  }

  /**
   * Stop listening for keyboard shortcuts
   */
  disable() {
    if (this.listener) {
      window.removeEventListener("keydown", this.listener);
      this.listener = null;
    }
  }

  /**
   * Get all registered shortcuts
   */
  getAll(): Array<{ id: string; shortcut: KeyboardShortcut }> {
    return Array.from(this.shortcuts.entries()).map(([id, shortcut]) => ({
      id,
      shortcut,
    }));
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.meta) parts.push("⌘");
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.alt) parts.push("Alt");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  }
}

export const shortcutManager = new KeyboardShortcutManager();

/**
 * Common keyboard shortcuts
 */
export const commonShortcuts = {
  // Navigation
  goToDashboard: {
    key: "d",
    ctrl: true,
    description: "Go to Dashboard",
  },
  goToEscrows: {
    key: "e",
    ctrl: true,
    description: "Go to Escrows",
  },
  goToSplits: {
    key: "s",
    ctrl: true,
    description: "Go to Splits",
  },

  // Actions
  createNew: {
    key: "n",
    ctrl: true,
    description: "Create New Escrow",
  },
  search: {
    key: "k",
    ctrl: true,
    description: "Open Search",
  },
  help: {
    key: "?",
    shift: true,
    description: "Show Keyboard Shortcuts",
  },

  // Escrow actions
  releaseEscrow: {
    key: "r",
    ctrl: true,
    shift: true,
    description: "Release Escrow Funds",
  },
  cancelEscrow: {
    key: "x",
    ctrl: true,
    shift: true,
    description: "Cancel Escrow",
  },
  shareEscrow: {
    key: "s",
    ctrl: true,
    shift: true,
    description: "Share Escrow",
  },

  // UI
  toggleSidebar: {
    key: "b",
    ctrl: true,
    description: "Toggle Sidebar",
  },
  closeModal: {
    key: "Escape",
    description: "Close Modal/Dialog",
  },
  refresh: {
    key: "r",
    ctrl: true,
    description: "Refresh Data",
  },

  // Copy
  copyAddress: {
    key: "c",
    ctrl: true,
    shift: true,
    description: "Copy Wallet Address",
  },
};

/**
 * React hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{ id: string; shortcut: KeyboardShortcut }>,
  enabled: boolean = true
) {
  if (typeof window === "undefined") return;

  // Register shortcuts
  if (enabled) {
    shortcuts.forEach(({ id, shortcut }) => {
      shortcutManager.register(id, shortcut);
    });

    // Enable listener
    shortcutManager.enable();
  }

  // Cleanup
  return () => {
    shortcuts.forEach(({ id }) => {
      shortcutManager.unregister(id);
    });
  };
}

/**
 * Check if user is on Mac
 */
export function isMac(): boolean {
  if (typeof window === "undefined") return false;
  return /Mac|iPhone|iPod|iPad/.test(navigator.platform);
}

/**
 * Get the appropriate modifier key for the platform
 */
export function getModifierKey(): "ctrl" | "meta" {
  return isMac() ? "meta" : "ctrl";
}

/**
 * Format modifier key for display
 */
export function formatModifier(): string {
  return isMac() ? "⌘" : "Ctrl";
}

/**
 * Predefined shortcut groups
 */
export const shortcutGroups = {
  navigation: {
    name: "Navigation",
    shortcuts: [
      { id: "dashboard", ...commonShortcuts.goToDashboard },
      { id: "escrows", ...commonShortcuts.goToEscrows },
      { id: "splits", ...commonShortcuts.goToSplits },
    ],
  },
  actions: {
    name: "Actions",
    shortcuts: [
      { id: "create", ...commonShortcuts.createNew },
      { id: "search", ...commonShortcuts.search },
      { id: "refresh", ...commonShortcuts.refresh },
    ],
  },
  escrow: {
    name: "Escrow",
    shortcuts: [
      { id: "release", ...commonShortcuts.releaseEscrow },
      { id: "cancel", ...commonShortcuts.cancelEscrow },
      { id: "share", ...commonShortcuts.shareEscrow },
    ],
  },
  ui: {
    name: "Interface",
    shortcuts: [
      { id: "sidebar", ...commonShortcuts.toggleSidebar },
      { id: "close", ...commonShortcuts.closeModal },
      { id: "help", ...commonShortcuts.help },
    ],
  },
};

