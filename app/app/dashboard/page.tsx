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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Splits</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your payment distribution contracts
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            + Create Split
          </button>
        </div>

        {/* Network Warning */}
        <NetworkChecker />

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-emerald-500"></div>
            <p className="mt-4 text-sm text-gray-500">Loading splits...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && splits.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="text-5xl mb-4">💸</div>
            <h3 className="text-lg font-semibold mb-2">No splits yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create your first split contract to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              Create Split
            </button>
          </div>
        )}

        {/* Splits Grid */}
        {!loading && splits.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {splits.map((split) => (
              <Link
                key={split.id}
                href={`/splits/${split.contract_address}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-mono text-sm font-medium text-gray-900 mb-1">
                      {truncateAddress(split.contract_address, 6)}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {formatDate(split.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(getBaseScanUrl(split.contract_address, chainId), '_blank', 'noopener,noreferrer');
                    }}
                    className="text-gray-400 hover:text-emerald-500 text-sm transition-colors"
                    aria-label="View on BaseScan"
                  >
                    ↗
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Recipients</span>
                  <span className="text-sm font-semibold text-gray-900">{split.recipients.length}</span>
                </div>

                <div className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {split.recipients.slice(0, 3).map((recipient, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-medium"
                      >
                        {recipient.percentage}%
                      </span>
                    ))}
                    {split.recipients.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
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
    </div>
  );
}

