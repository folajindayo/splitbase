/**
 * useGasEstimation Hook
 */

import { useState, useEffect } from 'react';

export function useGasEstimation(recipientCount: number) {
  const [gasPrice, setGasPrice] = useState('0');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGasPrice = async () => {
      try {
        setLoading(true);
        // Implementation would fetch current gas price
        setGasPrice('0');
        
        // Calculate estimated cost based on recipient count
        const baseCost = 21000;
        const perRecipient = 5000;
        const totalGas = baseCost + (recipientCount * perRecipient);
        setEstimatedCost(totalGas.toString());
      } catch (error) {
        console.error('Gas estimation error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGasPrice();
  }, [recipientCount]);

  return { gasPrice, estimatedCost, loading };
}


