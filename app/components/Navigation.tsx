"use client";

import Link from "next/link";
import { useAppKitAccount } from "@reown/appkit/react";
import { usePathname } from "next/navigation";
import { truncateAddress } from "@/lib/utils";

export default function Navigation() {
  const { address, isConnected } = useAppKitAccount();
  const pathname = usePathname();

  // Hide navigation on home page (landing page has its own)
  if (pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">SplitBase</span>
          </Link>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {isConnected && address && (
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/dashboard' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </Link>
                <div className="text-sm text-gray-500">
                  {truncateAddress(address)}
                </div>
              </div>
            )}
            <appkit-button />
          </div>
        </div>
      </div>
    </nav>
  );
}

