"use client";

import { useState, useRef, useEffect } from "react";
import type { Escrow } from "@/lib/escrow";

interface QuickActionsMenuProps {
  escrow: Escrow;
  userAddress?: string;
  onShare?: () => void;
  onExport?: () => void;
  onDispute?: () => void;
  onCancel?: () => void;
  onRelease?: () => void;
  onNote?: () => void;
}

export default function QuickActionsMenu({
  escrow,
  userAddress,
  onShare,
  onExport,
  onDispute,
  onCancel,
  onRelease,
  onNote,
}: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isBuyer = userAddress?.toLowerCase() === escrow.buyer_address.toLowerCase();
  const isSeller = userAddress?.toLowerCase() === escrow.seller_address.toLowerCase();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const actions = [
    // Universal actions
    {
      id: "share",
      label: "Share Escrow",
      icon: "🔗",
      onClick: onShare,
      show: true,
      color: "text-blue-600",
    },
    {
      id: "export",
      label: "Export Details",
      icon: "📥",
      onClick: onExport,
      show: true,
      color: "text-gray-600",
    },
    {
      id: "note",
      label: "Add Note",
      icon: "📝",
      onClick: onNote,
      show: true,
      color: "text-purple-600",
    },
    // Buyer actions
    {
      id: "release",
      label: "Release Funds",
      icon: "💸",
      onClick: onRelease,
      show: isBuyer && escrow.status === "funded",
      color: "text-green-600",
    },
    {
      id: "dispute",
      label: "Open Dispute",
      icon: "⚠️",
      onClick: onDispute,
      show: (isBuyer || isSeller) && escrow.status === "funded",
      color: "text-yellow-600",
    },
    {
      id: "cancel",
      label: "Cancel Escrow",
      icon: "❌",
      onClick: onCancel,
      show: isBuyer && (escrow.status === "pending" || escrow.status === "funded"),
      color: "text-red-600",
    },
    // Information
    {
      id: "copy-id",
      label: "Copy Escrow ID",
      icon: "📋",
      onClick: () => {
        navigator.clipboard.writeText(escrow.id);
        setIsOpen(false);
      },
      show: true,
      color: "text-gray-600",
    },
    {
      id: "copy-address",
      label: "Copy Custody Address",
      icon: "💼",
      onClick: () => {
        if (escrow.custody_wallet_address) {
          navigator.clipboard.writeText(escrow.custody_wallet_address);
          setIsOpen(false);
        }
      },
      show: !!escrow.custody_wallet_address,
      color: "text-indigo-600",
    },
    {
      id: "view-blockchain",
      label: "View on Explorer",
      icon: "🔍",
      onClick: () => {
        if (escrow.transaction_hash) {
          window.open(
            `https://sepolia.basescan.org/tx/${escrow.transaction_hash}`,
            "_blank"
          );
          setIsOpen(false);
        }
      },
      show: !!escrow.transaction_hash,
      color: "text-blue-600",
    },
  ].filter((action) => action.show);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Quick Actions"
      >
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
          {/* Menu Header */}
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Quick Actions
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {actions.map((action, index) => (
              <div key={action.id}>
                {/* Divider before critical actions */}
                {(action.id === "dispute" || action.id === "cancel") && index > 0 && (
                  <div className="border-t border-gray-100 my-1"></div>
                )}

                <button
                  onClick={() => {
                    if (action.onClick) {
                      action.onClick();
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${action.color}`}
                >
                  <span className="text-lg">{action.icon}</span>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Menu Footer */}
          <div className="px-4 py-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {isBuyer ? "You are the buyer" : isSeller ? "You are the seller" : "View only"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

