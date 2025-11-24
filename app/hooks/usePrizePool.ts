import { useState, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import {
  createPrizePool,
  fundPrizePool,
  requestPayout,
  approvePayout,
  getPoolDetails,
  getEventWinners,
  refundPool,
  PoolStatus,
} from "@/lib/contracts";

export function usePrizePool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: unknown) => {
    console.error("Prize Pool Error:", err);
    const message = err instanceof Error ? err.message : "An error occurred";
    setError(message);
    setLoading(false);
  }, []);

  // Create a new prize pool
  const createPool = useCallback(
    async (
      signer: JsonRpcSigner,
      eventId: number,
      tokenAddress: string,
      requiredSignatures: number,
      initialAmountEth?: string
    ) => {
      try {
        setLoading(true);
        setError(null);

        const result = await createPrizePool(
          signer,
          eventId,
          tokenAddress,
          requiredSignatures,
          initialAmountEth
        );

        setLoading(false);
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [handleError]
  );

  // Fund an existing pool
  const fundPool = useCallback(
    async (
      signer: JsonRpcSigner,
      poolId: number,
      amount: string,
      amountEth?: string
    ) => {
      try {
        setLoading(true);
        setError(null);

        const txHash = await fundPrizePool(signer, poolId, amount, amountEth);

        setLoading(false);
        return txHash;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [handleError]
  );

  // Request payout
  const requestPayment = useCallback(
    async (
      signer: JsonRpcSigner,
      poolId: number,
      recipients: string[],
      amounts: string[],
      reason: string
    ) => {
      try {
        setLoading(true);
        setError(null);

        const result = await requestPayout(
          signer,
          poolId,
          recipients,
          amounts,
          reason
        );

        setLoading(false);
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [handleError]
  );

  // Approve payout
  const approvePayment = useCallback(
    async (signer: JsonRpcSigner, payoutId: number) => {
      try {
        setLoading(true);
        setError(null);

        const txHash = await approvePayout(signer, payoutId);

        setLoading(false);
        return txHash;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [handleError]
  );

  // Get pool details
  const fetchPoolDetails = useCallback(
    async (provider: BrowserProvider, poolId: number) => {
      try {
        setLoading(true);
        setError(null);

        const details = await getPoolDetails(provider, poolId);

        setLoading(false);
        return details;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [handleError]
  );

  // Get event winners
  const fetchEventWinners = useCallback(
    async (provider: BrowserProvider, eventId: number) => {
      try {
        setLoading(true);
        setError(null);

        const winners = await getEventWinners(provider, eventId);

        setLoading(false);
        return winners;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [handleError]
  );

  // Refund pool
  const refundPoolFunds = useCallback(
    async (signer: JsonRpcSigner, poolId: number) => {
      try {
        setLoading(true);
        setError(null);

        const txHash = await refundPool(signer, poolId);

        setLoading(false);
        return txHash;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [handleError]
  );

  return {
    loading,
    error,
    createPool,
    fundPool,
    requestPayment,
    approvePayment,
    fetchPoolDetails,
    fetchEventWinners,
    refundPoolFunds,
    PoolStatus,
  };
}

