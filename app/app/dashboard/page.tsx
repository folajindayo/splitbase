"use client";

import { useEffect, useState } from "react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUserSplits, SplitWithRecipients } from "@/lib/splits";
import { truncateAddress, formatDate, getBaseScanUrl } from "@/lib/utils";
import CreateSplitModal from "@/components/CreateSplitModal";
import NetworkChecker from "@/components/NetworkChecker";
import { useAppKitNetwork } from "@reown/appkit/react";

export default function Dashboard() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const router = useRouter();
  const [splits, setSplits] = useState<SplitWithRecipients[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const chainId = caipNetwork?.id ? parseInt(caipNetwork.id.toString()) : 84532;

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    if (address) {
      loadSplits();
    }
  }, [isConnected, address, router]);

  const loadSplits = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const userSplits = await getUserSplits(address);
      setSplits(userSplits);
    } catch (error) {
      console.error("Failed to load splits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSplitCreated = () => {
    setShowCreateModal(false);
    loadSplits();
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Splits</h1>
        <p className="text-gray-600">
          Manage your split payment contracts on Base
        </p>
      </div>

      {/* Network Warning */}
      <NetworkChecker />

      {/* Create Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>Create New Split</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your splits...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && splits.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">💸</div>
          <h3 className="text-xl font-semibold mb-2">No splits yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first split contract to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Create Split
          </button>
        </div>
      )}

      {/* Splits Grid */}
      {!loading && splits.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {splits.map((split) => (
            <Link
              key={split.id}
              href={`/splits/${split.contract_address}`}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-mono text-sm font-semibold mb-2">
                    {truncateAddress(split.contract_address, 6)}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {formatDate(split.created_at)}
                  </p>
                </div>
                <a
                  href={getBaseScanUrl(split.contract_address, chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ↗
                </a>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Recipients</span>
                  <span className="font-semibold">{split.recipients.length}</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Split:</div>
                <div className="flex flex-wrap gap-2">
                  {split.recipients.slice(0, 3).map((recipient, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs"
                    >
                      {recipient.percentage}%
                    </span>
                  ))}
                  {split.recipients.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs">
                      +{split.recipients.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateSplitModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSplitCreated}
        />
      )}
    </div>
  );
}

