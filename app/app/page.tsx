"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isConnected } = useAppKitAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-3xl">S</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Split Payments Onchain
        </h1>
        
        <p className="text-lg text-gray-500 mb-8">
          Automatically distribute funds among multiple recipients with smart contracts on Base
        </p>

        <appkit-button />

        <div className="mt-16 grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="text-sm font-semibold mb-1">Instant</h3>
            <p className="text-xs text-gray-500">
              Deploy in minutes
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="text-sm font-semibold mb-1">Secure</h3>
            <p className="text-xs text-gray-500">
              Smart contract powered
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="text-sm font-semibold mb-1">Automatic</h3>
            <p className="text-xs text-gray-500">
              Funds split instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
