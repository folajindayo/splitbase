/**
 * useContract Hook
 */

'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export function useContract() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callContract = useCallback(async (
    contractAddress: string,
    abi: any[],
    method: string,
    params: any[]
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const result = await contract[method](...params);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { callContract, loading, error };
}

