"use client";

import { useState, useEffect } from "react";
import { JsonRpcProvider } from "ethers";

interface GasFeeEstimateProps {
  chainId?: number;
  showDetails?: boolean;
}

export default function GasFeeEstimate({ 
  chainId = 84532, 
  showDetails = false 
}: GasFeeEstimateProps) {
  const [gasPrice, setGasPrice] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGasFee();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchGasFee, 30000);
    
    return () => clearInterval(interval);
  }, [chainId]);

  const fetchGasFee = async () => {
    try {
      const rpcUrl = chainId === 84532
        ? "https://sepolia.base.org"
        : "https://mainnet.base.org";

      const provider = new JsonRpcProvider(rpcUrl);
      const feeData = await provider.getFeeData();
      
      if (feeData.gasPrice) {
        const gasPriceGwei = Number(feeData.gasPrice) / 1e9;
        setGasPrice(gasPriceGwei.toFixed(2));

        // Estimate cost for standard ETH transfer (21000 gas)
        const estimatedGas = 21000;
        const costWei = Number(feeData.gasPrice) * estimatedGas;
        const costEth = (costWei / 1e18).toFixed(6);
        setEstimatedCost(costEth);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching gas fee:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-gray-600">
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Fetching gas...</span>
      </div>
    );
  }

  if (!gasPrice || !estimatedCost) {
    return null;
  }

  if (showDetails) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-600">⛽</span>
          <h4 className="text-sm font-semibold text-blue-900">Current Gas Fees</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-blue-600 font-medium">Gas Price</div>
            <div className="text-blue-900 font-bold">{gasPrice} Gwei</div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">Est. Cost</div>
            <div className="text-blue-900 font-bold">{estimatedCost} ETH</div>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Estimated for standard transaction (21,000 gas)
        </p>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <span className="text-gray-600">⛽ Gas:</span>
      <span className="font-semibold text-gray-900">{gasPrice} Gwei</span>
      <span className="text-gray-500">~</span>
      <span className="font-semibold text-gray-900">{estimatedCost} ETH</span>
    </div>
  );
}

