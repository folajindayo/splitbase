"use client";

import { useState } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "warning" | "success" | "primary";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfirmButtonClasses = () => {
    const base = "flex-1 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    switch (confirmVariant) {
      case "danger":
        return `${base} bg-red-600 text-white hover:bg-red-700`;
      case "warning":
        return `${base} bg-yellow-500 text-white hover:bg-yellow-600`;
      case "success":
        return `${base} bg-green-600 text-white hover:bg-green-700`;
      default:
        return `${base} bg-blue-600 text-white hover:bg-blue-700`;
    }
  };

  const getIcon = () => {
    switch (confirmVariant) {
      case "danger":
        return "🚨";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      default:
        return "❓";
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fade-in"
        onClick={onCancel}
      ></div>

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getIcon()}</span>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700">{message}</p>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing || loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing || loading}
              className={getConfirmButtonClasses()}
            >
              {isProcessing || loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook for using confirm dialog
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "success" | "primary";
    onConfirm?: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const confirm = (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "success" | "primary";
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        ...options,
        isOpen: true,
        onConfirm: () => {
          resolve(true);
          setDialogState((prev) => ({ ...prev, isOpen: false }));
        },
      });
    });
  };

  const cancel = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    confirm,
    ConfirmDialogComponent: (
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmLabel={dialogState.confirmLabel}
        cancelLabel={dialogState.cancelLabel}
        confirmVariant={dialogState.variant}
        onConfirm={dialogState.onConfirm || (() => {})}
        onCancel={cancel}
      />
    ),
  };
}

