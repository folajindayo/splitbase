"use client";

import { useAppKitNetwork } from "@reown/appkit/react";
import { NETWORK_NAMES, DEFAULT_CHAIN_ID } from "@/lib/constants";

export default function NetworkChecker() {
  const { caipNetwork, switchNetwork } = useAppKitNetwork();
  
  const chainId = caipNetwork?.id ? parseInt(caipNetwork.id.toString()) : null;
  const isSupported = chainId && Object.keys(NETWORK_NAMES).includes(chainId.toString());

  if (isSupported || !chainId) {
    return null;
  }

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork({ chainId: DEFAULT_CHAIN_ID });
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-yellow-800">
            Unsupported network. Switch to Base Sepolia or Base Mainnet.
          </p>
        </div>
        <button
          onClick={handleSwitchNetwork}
          className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          Switch Network
        </button>
      </div>
    </div>
  );
}

