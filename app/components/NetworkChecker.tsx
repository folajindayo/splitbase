"use client";

import { useAppKitNetwork } from "@reown/appkit/react";

const SUPPORTED_NETWORKS = {
  84532: "Base Sepolia",
  8453: "Base Mainnet",
};

export default function NetworkChecker() {
  const { caipNetwork, switchNetwork } = useAppKitNetwork();
  
  const chainId = caipNetwork?.id ? parseInt(caipNetwork.id.toString()) : null;
  const isSupported = chainId && Object.keys(SUPPORTED_NETWORKS).includes(chainId.toString());

  if (isSupported || !chainId) {
    return null;
  }

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork({ chainId: 84532 }); // Switch to Base Sepolia by default
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
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
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            You're connected to an unsupported network. Please switch to Base Sepolia or Base Mainnet to continue.
          </p>
        </div>
        <div className="ml-4">
          <button
            onClick={handleSwitchNetwork}
            className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Switch Network
          </button>
        </div>
      </div>
    </div>
  );
}

