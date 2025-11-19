"use client";

import { useState } from "react";
import { useAppKitAccount, useAppKitProvider, useAppKitNetwork } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import { createSplit, getFactoryAddress } from "@/lib/contracts";
import { saveSplit } from "@/lib/splits";
import { isValidAddress, validatePercentages, hasDuplicateAddresses } from "@/lib/utils";
import { DEFAULT_CHAIN_ID } from "@/lib/constants";
import TemplatesModal from "./TemplatesModal";
import AddressInput from "./AddressInput";
import { resolveNameToAddress } from "@/lib/nameResolver";

// Extend Window interface for ethereum provider
declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

interface Recipient {
  address: string;
  percentage: string;
  email?: string;
  emailNotifications?: boolean;
}

interface CreateSplitModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSplitModal({ onClose, onSuccess }: CreateSplitModalProps) {
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { caipNetwork } = useAppKitNetwork();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: "", percentage: "" },
    { address: "", percentage: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerEmailNotifications, setOwnerEmailNotifications] = useState(false);

  const chainId = caipNetwork?.id ? parseInt(caipNetwork.id.toString()) : DEFAULT_CHAIN_ID;
  
  // Check if using browser extension (preferred) vs WalletConnect
  const isUsingBrowserWallet = typeof window !== 'undefined' && 
    (window.ethereum || (walletProvider as Record<string, unknown>)?.isMetaMask);

  const addRecipient = () => {
    if (recipients.length < 10) {
      setRecipients([...recipients, { address: "", percentage: "" }]);
    }
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 2) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: "address" | "percentage", value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
    setError(""); // Clear error on input
  };

  const handleTemplateSelect = (templateRecipients: { address: string; percentage: string }[]) => {
    setRecipients(templateRecipients);
    setError("");
  };

  const validateInputs = (): string | null => {
    // Check name is provided
    if (!name.trim()) {
      return "Please provide a name for your split";
    }

    // Check all fields are filled
    if (recipients.some((r) => !r.address || !r.percentage)) {
      return "Please fill all recipient fields";
    }

    // Validate addresses
    const invalidAddress = recipients.find((r) => !isValidAddress(r.address));
    if (invalidAddress) {
      return "Invalid Ethereum address";
    }

    // Check for duplicates
    if (hasDuplicateAddresses(recipients.map((r) => r.address))) {
      return "Duplicate addresses are not allowed";
    }

    // Validate percentages
    const percentages = recipients.map((r) => parseFloat(r.percentage));
    if (percentages.some((p) => isNaN(p) || p <= 0 || p > 100)) {
      return "Percentages must be between 0 and 100";
    }

    if (!validatePercentages(percentages)) {
      return "Percentages must sum to exactly 100";
    }

    return null;
  };

  const handleCreate = async () => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!walletProvider) {
      setError("Wallet provider not available. Please reconnect your wallet.");
      return;
    }

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Resolve any ENS/Basename names to addresses
      let resolverProvider: BrowserProvider | undefined;
      if (typeof window !== "undefined" && window.ethereum) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolverProvider = new BrowserProvider(window.ethereum as any);
      } else if (walletProvider) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolverProvider = new BrowserProvider(walletProvider as any);
      }

      const recipientAddresses: string[] = [];
      for (const recipient of recipients) {
        let recipientAddress = recipient.address;
        
        // Try to resolve if it looks like a domain name
        if (recipientAddress.includes(".eth")) {
          const resolved = await resolveNameToAddress(recipientAddress, resolverProvider);
          if (resolved) {
            recipientAddress = resolved;
          }
        }
        
        recipientAddresses.push(recipientAddress);
      }
      console.log("Creating split with chainId:", chainId);
      console.log("Wallet provider type:", walletProvider?.constructor?.name);
      console.log("Is using browser wallet:", isUsingBrowserWallet);
      
      // Prefer window.ethereum if available (direct MetaMask connection)
      // This avoids W3mFrameProvider restrictions
      let providerToUse: Record<string, unknown> | undefined = walletProvider as Record<string, unknown> | undefined;
      
      if (typeof window !== 'undefined' && window.ethereum && isUsingBrowserWallet) {
        console.log("Using window.ethereum directly");
        
        // Request accounts to ensure we have the current selected account
        const ethereumProvider = window.ethereum as Record<string, unknown> & {
          request: (args: { method: string }) => Promise<string[]>;
        };
        const accounts = await ethereumProvider.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found. Please connect your wallet.");
        }
        
        // Verify the first account matches our connected address
        if (accounts[0].toLowerCase() !== address.toLowerCase()) {
          throw new Error(
            "Wallet address mismatch. Please ensure the same account is selected in both your wallet and this app."
          );
        }
        
        providerToUse = window.ethereum;
      }
      
      if (!providerToUse) {
        throw new Error("No wallet provider available");
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new BrowserProvider(providerToUse as any);
      
      // Get network to verify we're on the right chain
      const network = await provider.getNetwork();
      console.log("Provider network:", network.chainId.toString());
      
      // Get signer
      const signer = await provider.getSigner();

      // Verify signer address matches connected wallet
      const signerAddress = await signer.getAddress();
      console.log("Signer address:", signerAddress);
      console.log("Connected address:", address);
      
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error(
          "Wallet address mismatch. Please reconnect your wallet and ensure the same account is selected."
        );
      }

      const percentages = recipients.map((r) => parseInt(r.percentage));

      console.log("Recipients:", recipientAddresses);
      console.log("Percentages:", percentages);

      // Create split contract
      const { splitAddress } = await createSplit(
        signer,
        chainId,
        recipientAddresses,
        percentages
      );

      console.log("Split created at:", splitAddress);

      // Save to database
      const factoryAddress = getFactoryAddress(chainId);
      await saveSplit(
        splitAddress,
        address,
        factoryAddress,
        recipients.map((r) => ({
          wallet_address: r.address,
          percentage: parseInt(r.percentage),
          email: r.email,
          email_notifications: r.emailNotifications,
        })),
        name.trim(),
        description.trim() || undefined,
        ownerEmailNotifications ? ownerEmail.trim() : undefined,
        ownerEmailNotifications
      );

      onSuccess();
    } catch (err) {
      console.error("Failed to create split:", err);
      const error = err as Error;
      
      // Handle specific error types
      let errorMessage = "Failed to create split. Please try again.";
      
      if (error.message.includes("user rejected") || error.message.includes("denied")) {
        errorMessage = "Transaction was rejected. Please approve the transaction in your wallet.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds to create split. You need ETH to pay for gas fees.";
      } else if (error.message.includes("network") || error.message.includes("chain")) {
        errorMessage = `Please switch to Base Sepolia network in your wallet.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const currentSum = recipients.reduce((sum, r) => {
    const val = parseFloat(r.percentage);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Create Split Contract</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Split Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Team Revenue Split, Project Funding"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* Description (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              placeholder="Add notes about this split contract..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              disabled={loading}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="border-t border-gray-200 pt-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
              Add recipients and their split percentages. The total must equal 100%.
            </p>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                disabled={loading}
              >
                <span>📋</span>
                Use Template
              </button>
            </div>
          </div>

          {/* Recipients List */}
          <div className="space-y-4 mb-6">
            {recipients.map((recipient, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <AddressInput
                    value={recipient.address}
                    onChange={(value) => updateRecipient(index, "address", value)}
                    placeholder="0x... or name.eth / name.base.eth"
                    disabled={loading}
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    placeholder="0"
                    value={recipient.percentage}
                    onChange={(e) => updateRecipient(index, "percentage", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    disabled={loading}
                  />
                </div>
                <div className="text-gray-600 pt-2">%</div>
                {recipients.length > 2 && (
                  <button
                    onClick={() => removeRecipient(index)}
                    className="text-red-600 hover:text-red-700 pt-2"
                    disabled={loading}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Recipient Button */}
          {recipients.length < 10 && (
            <button
              onClick={addRecipient}
              className="text-blue-600 hover:text-blue-700 font-medium mb-4"
              disabled={loading}
            >
              + Add Recipient
            </button>
          )}

          {/* Percentage Sum */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total Percentage:</span>
              <span
                className={`text-lg font-bold ${
                  currentSum === 100 ? "text-green-600" : "text-red-600"
                }`}
              >
                {currentSum}%
              </span>
            </div>
            {currentSum !== 100 && (
              <p className="text-sm text-red-600 mt-2">
                Must equal 100% (currently {currentSum > 100 ? "over" : "under"} by{" "}
                {Math.abs(100 - currentSum)}%)
              </p>
            )}
          </div>

          {/* Email Notifications (Optional) */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p className="text-xs text-gray-500 mt-0.5">Get notified when your split receives payments</p>
              </div>
              <div className="relative inline-block w-11 h-6">
                <input
                  id="owner-email-toggle"
                  type="checkbox"
                  checked={ownerEmailNotifications}
                  onChange={(e) => setOwnerEmailNotifications(e.target.checked)}
                  disabled={loading}
                  className="sr-only peer"
                />
                <label
                  htmlFor="owner-email-toggle"
                  className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-colors peer-checked:bg-blue-600"
                >
                  <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5" />
                </label>
              </div>
            </div>
            
            {ownerEmailNotifications && (
              <div className="mt-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || currentSum !== 100}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Deploy Split"}
            </button>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplatesModal && (
        <TemplatesModal
          onClose={() => setShowTemplatesModal(false)}
          onSelectTemplate={handleTemplateSelect}
          currentRecipients={recipients}
          splitName={name}
        />
      )}
    </div>
  );
}

