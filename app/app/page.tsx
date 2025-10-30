"use client";

import Link from "next/link";
import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isConnected } = useAppKitAccount();
  const router = useRouter();

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Split Payments
          <span className="block text-blue-600 mt-2">Onchain, Automatically</span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create smart contracts that automatically distribute funds among team
          members. Powered by Base blockchain and WalletConnect.
        </p>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <appkit-button />
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Instant Setup</h3>
            <p className="text-gray-600">
              Connect your wallet, add recipients, and deploy in minutes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Secure & Trustless</h3>
            <p className="text-gray-600">
              Smart contracts ensure funds are distributed exactly as configured.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">Auto Distribution</h3>
            <p className="text-gray-600">
              Payments are automatically split when funds are received.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-10">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6 text-left">
            <div>
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Connect Wallet</h4>
              <p className="text-sm text-gray-600">
                Sign in with your wallet via WalletConnect
              </p>
            </div>

            <div>
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">Add Recipients</h4>
              <p className="text-sm text-gray-600">
                Enter wallet addresses and split percentages
              </p>
            </div>

            <div>
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Deploy Contract</h4>
              <p className="text-sm text-gray-600">
                Your split contract is deployed on Base
              </p>
            </div>

            <div>
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4">
                4
              </div>
              <h4 className="font-semibold mb-2">Receive & Split</h4>
              <p className="text-sm text-gray-600">
                Funds auto-distribute to all recipients
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
