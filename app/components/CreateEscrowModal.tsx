"use client";

import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { createEscrow } from "@/lib/escrow";
import { isValidAddress } from "@/lib/utils";
import AddressInput from "./AddressInput";
import { resolveNameToAddress } from "@/lib/nameResolver";

interface CreateEscrowModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Milestone {
  title: string;
  description: string;
  percentage: string;
}

type EscrowType = 'simple' | 'time_locked' | 'milestone';

export default function CreateEscrowModal({ onClose, onSuccess }: CreateEscrowModalProps) {
  const { address } = useAppKitAccount();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ETH");

  // Step 2: Escrow Type
  const [escrowType, setEscrowType] = useState<EscrowType>('simple');

  // Step 3: Configuration
  const [releaseDate, setReleaseDate] = useState("");
  const [autoRelease, setAutoRelease] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: "", description: "", percentage: "" },
  ]);

  const addMilestone = () => {
    if (milestones.length < 10) {
      setMilestones([...milestones, { title: "", description: "", percentage: "" }]);
    }
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
    setError("");
  };

  const validateStep1 = (): string | null => {
    if (!title.trim()) return "Please provide a title for your escrow";
    if (!sellerAddress.trim()) return "Please provide the seller's address";
    if (!isValidAddress(sellerAddress)) return "Invalid seller address";
    if (!amount || parseFloat(amount) <= 0) return "Please provide a valid amount";
    return null;
  };

  const validateStep3 = (): string | null => {
    if (escrowType === 'time_locked') {
      if (!releaseDate) return "Please select a release date";
      const selectedDate = new Date(releaseDate);
      if (selectedDate <= new Date()) return "Release date must be in the future";
    }

    if (escrowType === 'milestone') {
      if (milestones.some((m) => !m.title.trim())) {
        return "Please provide a title for all milestones";
      }
      if (milestones.some((m) => !m.percentage || parseFloat(m.percentage) <= 0)) {
        return "Please provide valid percentages for all milestones";
      }
      const totalPercentage = milestones.reduce(
        (sum, m) => sum + parseFloat(m.percentage || "0"),
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return `Milestone percentages must total 100% (currently ${totalPercentage.toFixed(2)}%)`;
      }
    }

    return null;
  };

  const handleNext = () => {
    setError("");
    
    if (step === 1) {
      const error = validateStep1();
      if (error) {
        setError(error);
        return;
      }
    }

    if (step === 3) {
      const error = validateStep3();
      if (error) {
        setError(error);
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError("");
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Resolve ENS/Basename if needed
      let resolvedSellerAddress = sellerAddress;
      if (sellerAddress.endsWith('.eth')) {
        const resolved = await resolveNameToAddress(sellerAddress);
        if (!resolved) {
          throw new Error("Could not resolve seller address");
        }
        resolvedSellerAddress = resolved;
      }

      // Generate deposit address (using seller's address as placeholder)
      const depositAddress = resolvedSellerAddress;

      // Prepare escrow data
      const escrowData = {
        title,
        description: description || undefined,
        buyer_address: address,
        seller_address: resolvedSellerAddress,
        total_amount: parseFloat(amount),
        currency,
        escrow_type: escrowType,
        deposit_address: depositAddress,
        ...(escrowType === 'time_locked' && {
          release_date: new Date(releaseDate).toISOString(),
          auto_release: autoRelease,
        }),
        ...(escrowType === 'milestone' && {
          milestones: milestones.map((m, index) => ({
            title: m.title,
            description: m.description || undefined,
            amount: (parseFloat(amount) * parseFloat(m.percentage)) / 100,
            order_index: index + 1,
          })),
        }),
      };

      const escrowId = await createEscrow(escrowData);
      console.log("Escrow created:", escrowId);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating escrow:", err);
      setError(err instanceof Error ? err.message : "Failed to create escrow");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((num) => (
        <div key={num} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              num === step
                ? "bg-blue-500 text-white"
                : num < step
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {num < step ? "✓" : num}
          </div>
          {num < 4 && (
            <div
              className={`w-12 h-1 mx-2 ${
                num < step ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Escrow Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Website Development Project"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Describe the terms and conditions..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seller Address *
        </label>
        <AddressInput
          value={sellerAddress}
          onChange={setSellerAddress}
          placeholder="0x... or name.eth"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount *
          </label>
          <input
            type="number"
            step="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ETH">ETH</option>
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
            <option value="DAI">DAI</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Choose Escrow Type</h3>
      
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setEscrowType('simple')}
          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
            escrowType === 'simple'
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="font-semibold text-lg mb-1">Simple Escrow</div>
          <div className="text-sm text-gray-600">
            Buyer deposits funds, seller delivers, buyer releases payment in one go.
          </div>
        </button>

        <button
          type="button"
          onClick={() => setEscrowType('time_locked')}
          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
            escrowType === 'time_locked'
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="font-semibold text-lg mb-1">Time-Locked Escrow</div>
          <div className="text-sm text-gray-600">
            Same as simple, but with a deadline. Funds can be auto-released after the date.
          </div>
        </button>

        <button
          type="button"
          onClick={() => setEscrowType('milestone')}
          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
            escrowType === 'milestone'
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="font-semibold text-lg mb-1">Milestone Escrow</div>
          <div className="text-sm text-gray-600">
            Release funds in stages as milestones are completed and approved.
          </div>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (escrowType === 'simple') {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Configuration</h3>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✓</div>
            <p className="text-gray-600">
              No additional configuration needed for simple escrow.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Click Next to review your escrow.
            </p>
          </div>
        </div>
      );
    }

    if (escrowType === 'time_locked') {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Time Lock Configuration</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Release Date *
            </label>
            <input
              type="datetime-local"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              The earliest date when funds can be released to the seller.
            </p>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="autoRelease"
              checked={autoRelease}
              onChange={(e) => setAutoRelease(e.target.checked)}
              className="mt-1 mr-3"
            />
            <label htmlFor="autoRelease" className="text-sm">
              <span className="font-medium">Enable Auto-Release</span>
              <p className="text-gray-600">
                Automatically release funds to seller after the release date (buyer can still release earlier).
              </p>
            </label>
          </div>
        </div>
      );
    }

    // Milestone
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">Milestone Configuration</h3>
        
        {milestones.map((milestone, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Milestone {index + 1}</span>
              {milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={milestone.title}
                  onChange={(e) => updateMilestone(index, "title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Design Phase Complete"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={milestone.description}
                  onChange={(e) => updateMilestone(index, "description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the milestone..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percentage of Total *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={milestone.percentage}
                    onChange={(e) => updateMilestone(index, "percentage", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="text-gray-600">%</span>
                  {amount && milestone.percentage && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({((parseFloat(amount) * parseFloat(milestone.percentage)) / 100).toFixed(4)} {currency})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {milestones.length < 10 && (
          <button
            type="button"
            onClick={addMilestone}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
          >
            + Add Milestone
          </button>
        )}

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Total Percentage:</span>
            <span className={`font-medium ${
              Math.abs(milestones.reduce((sum, m) => sum + parseFloat(m.percentage || "0"), 0) - 100) < 0.01
                ? "text-green-600"
                : "text-red-600"
            }`}>
              {milestones.reduce((sum, m) => sum + parseFloat(m.percentage || "0"), 0).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const totalAmount = parseFloat(amount);
    
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">Review & Create</h3>
        
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div>
            <div className="text-sm text-gray-600">Title</div>
            <div className="font-medium">{title}</div>
          </div>

          {description && (
            <div>
              <div className="text-sm text-gray-600">Description</div>
              <div className="font-medium">{description}</div>
            </div>
          )}

          <div>
            <div className="text-sm text-gray-600">Seller Address</div>
            <div className="font-mono text-sm">{sellerAddress}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="font-medium text-xl">{amount} {currency}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600">Escrow Type</div>
            <div className="font-medium capitalize">{escrowType.replace('_', ' ')}</div>
          </div>

          {escrowType === 'time_locked' && (
            <>
              <div>
                <div className="text-sm text-gray-600">Release Date</div>
                <div className="font-medium">
                  {new Date(releaseDate).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Auto-Release</div>
                <div className="font-medium">{autoRelease ? "Yes" : "No"}</div>
              </div>
            </>
          )}

          {escrowType === 'milestone' && (
            <div>
              <div className="text-sm text-gray-600 mb-2">Milestones</div>
              <div className="space-y-2">
                {milestones.map((milestone, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-gray-200">
                    <div className="font-medium">{milestone.title}</div>
                    {milestone.description && (
                      <div className="text-sm text-gray-600">{milestone.description}</div>
                    )}
                    <div className="text-sm text-blue-600 mt-1">
                      {milestone.percentage}% ({((totalAmount * parseFloat(milestone.percentage)) / 100).toFixed(4)} {currency})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="font-medium text-blue-800 mb-2">🔒 Secure Custody</div>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>You will be the buyer for this escrow</li>
            <li>Funds will be held securely in SplitBase's custodial wallet</li>
            <li>You retain full control - only you can approve fund release</li>
            <li>Funds are protected and only released when conditions are met</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Create New Escrow</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {renderStepIndicator()}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            )}
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Escrow"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

