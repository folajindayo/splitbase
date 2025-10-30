"use client";

import Link from "next/link";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { truncateAddress } from "@/lib/utils";

export default function Navigation() {
  const { address, isConnected } = useAppKitAccount();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">SplitBase</div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {isConnected && (
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Dashboard
              </Link>
            )}

            {/* Wallet Button */}
            <div className="flex items-center space-x-3">
              {isConnected && address && (
                <div className="hidden sm:block text-sm text-gray-600">
                  {truncateAddress(address)}
                </div>
              )}
              <appkit-button />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

