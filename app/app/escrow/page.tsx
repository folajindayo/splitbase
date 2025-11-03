"use client";

import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { getUserEscrows, getEscrowStats, EscrowWithMilestones } from "@/lib/escrow";
import CreateEscrowModal from "@/components/CreateEscrowModal";
import EscrowCard from "@/components/EscrowCard";

export default function EscrowPage() {
  const { address, isConnected } = useAppKitAccount();
  const router = useRouter();

  const [escrows, setEscrows] = useState<EscrowWithMilestones[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'buyer' | 'seller'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalEscrows: 0,
    asBuyer: 0,
    asSeller: 0,
    totalAmount: 0,
    activeEscrows: 0,
    completedEscrows: 0,
  });

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  useEffect(() => {
    if (address) {
      loadEscrows();
      loadStats();
    }
  }, [address]);

  const loadEscrows = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const data = await getUserEscrows(address, 'all');
      setEscrows(data);
    } catch (error) {
      console.error("Error loading escrows:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!address) return;

    try {
      const statsData = await getEscrowStats(address);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleCreateSuccess = () => {
    loadEscrows();
    loadStats();
  };

  // Filter escrows
  const filteredEscrows = escrows.filter((escrow) => {
    // Role filter
    if (filterRole === 'buyer' && escrow.buyer_address.toLowerCase() !== address?.toLowerCase()) {
      return false;
    }
    if (filterRole === 'seller' && escrow.seller_address.toLowerCase() !== address?.toLowerCase()) {
      return false;
    }

    // Status filter
    if (filterStatus === 'active' && !['pending', 'funded'].includes(escrow.status)) {
      return false;
    }
    if (filterStatus === 'completed' && escrow.status !== 'released') {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        escrow.title.toLowerCase().includes(query) ||
        escrow.description?.toLowerCase().includes(query) ||
        escrow.buyer_address.toLowerCase().includes(query) ||
        escrow.seller_address.toLowerCase().includes(query)
      );
    }

    return true;
  });

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Escrow Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage your escrow agreements and track payments
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Total Escrows</div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalEscrows}</div>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">As Buyer</div>
                <div className="text-3xl font-bold text-blue-600">{stats.asBuyer}</div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💳</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">As Seller</div>
                <div className="text-3xl font-bold text-green-600">{stats.asSeller}</div>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Active</div>
                <div className="text-3xl font-bold text-orange-600">{stats.activeEscrows}</div>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search escrows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as 'all' | 'buyer' | 'seller')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="buyer">As Buyer</option>
                <option value="seller">As Seller</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'completed')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap shadow-sm hover:shadow transition-all"
              >
                + Create Escrow
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredEscrows.length} of {escrows.length} escrows
          </div>
        </div>

        {/* Escrow List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading escrows...</p>
          </div>
        ) : filteredEscrows.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {escrows.length === 0 ? "No Escrows Yet" : "No Matching Escrows"}
            </h3>
            <p className="text-gray-600 mb-6">
              {escrows.length === 0
                ? "Create your first escrow to get started"
                : "Try adjusting your filters or search query"}
            </p>
            {escrows.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                Create Your First Escrow
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEscrows.map((escrow) => (
              <EscrowCard
                key={escrow.id}
                escrow={escrow}
                userAddress={address}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Escrow Modal */}
      {showCreateModal && (
        <CreateEscrowModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}

