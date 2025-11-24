# PrizePoolEscrow Contract Integration

This document explains how to use the PrizePoolEscrow contract in the SplitBase application.

## Contract Details

- **Contract Address**: `0xFe3989D74711b1dda30cf4a52F3DE14392185097`
- **Network**: Base Mainnet (Chain ID: 8453)
- **ABI Location**: `/abi.ts` (root directory)

## Overview

The PrizePoolEscrow contract is a multi-signature escrow system for managing hackathon and grant prizes. It supports:

- Native ETH and ERC20 token prizes
- Role-based access control (HOST, JUDGE, ADMIN)
- Multi-signature approval for payouts
- Time-locked emergency withdrawals
- Batch payout processing

## Usage in React Components

### 1. Using the Hook

The `usePrizePool` hook provides a convenient way to interact with the contract:

```typescript
import { usePrizePool } from '@/hooks/usePrizePool';
import { useEthersSigner } from '@/hooks/useEthersSigner';

function PrizePoolComponent() {
  const signer = useEthersSigner();
  const {
    loading,
    error,
    createPool,
    fundPool,
    requestPayment,
    approvePayment,
    fetchPoolDetails,
    fetchEventWinners,
    PoolStatus,
  } = usePrizePool();

  // Create a new prize pool
  const handleCreatePool = async () => {
    if (!signer) return;

    try {
      const result = await createPool(
        signer,
        1, // eventId
        '0x0000000000000000000000000000000000000000', // address(0) for ETH
        2, // required signatures
        '1000000000000000000' // 1 ETH in wei
      );

      console.log('Pool created:', result.poolId);
      console.log('Transaction:', result.txHash);
    } catch (err) {
      console.error('Failed to create pool:', err);
    }
  };

  // Fund an existing pool
  const handleFundPool = async (poolId: number) => {
    if (!signer) return;

    try {
      const txHash = await fundPool(
        signer,
        poolId,
        '0', // ERC20 amount (0 for ETH)
        '500000000000000000' // 0.5 ETH in wei
      );

      console.log('Pool funded:', txHash);
    } catch (err) {
      console.error('Failed to fund pool:', err);
    }
  };

  // Request payout for winners
  const handleRequestPayout = async (poolId: number) => {
    if (!signer) return;

    try {
      const result = await requestPayment(
        signer,
        poolId,
        ['0x1234...', '0x5678...'], // recipient addresses
        ['300000000000000000', '200000000000000000'], // amounts in wei
        'Hackathon winners payout'
      );

      console.log('Payout requested:', result.payoutId);
    } catch (err) {
      console.error('Failed to request payout:', err);
    }
  };

  // Approve payout (requires JUDGE or ADMIN role)
  const handleApprovePayout = async (payoutId: number) => {
    if (!signer) return;

    try {
      const txHash = await approvePayment(signer, payoutId);
      console.log('Payout approved:', txHash);
    } catch (err) {
      console.error('Failed to approve payout:', err);
    }
  };

  return (
    <div>
      {loading && <p>Processing...</p>}
      {error && <p>Error: {error}</p>}
      
      <button onClick={handleCreatePool}>Create Pool</button>
      <button onClick={() => handleFundPool(1)}>Fund Pool</button>
      <button onClick={() => handleRequestPayout(1)}>Request Payout</button>
      <button onClick={() => handleApprovePayout(1)}>Approve Payout</button>
    </div>
  );
}
```

### 2. Direct Contract Functions

You can also use the contract functions directly:

```typescript
import { BrowserProvider } from 'ethers';
import {
  getPoolDetails,
  getEventWinners,
  createPrizePool,
  PoolStatus,
} from '@/lib/contracts';

async function fetchPoolInfo(provider: BrowserProvider, poolId: number) {
  const details = await getPoolDetails(provider, poolId);
  
  console.log('Pool details:', {
    eventId: details.eventId.toString(),
    host: details.host,
    totalAmount: details.totalAmount.toString(),
    remainingAmount: details.remainingAmount.toString(),
    status: details.status, // 0=Active, 1=Locked, 2=Completed, 3=Cancelled
  });
}

async function fetchWinners(provider: BrowserProvider, eventId: number) {
  const winners = await getEventWinners(provider, eventId);
  
  winners.forEach((winner, index) => {
    console.log(`Winner ${index + 1}:`, {
      recipient: winner.recipient,
      amount: winner.amount.toString(),
      rank: winner.rank.toString(),
      projectName: winner.projectName,
    });
  });
}
```

## API Routes

Server-side API routes are available for fetching pool data:

### GET /api/prize-pool

Fetch details for a specific prize pool:

```typescript
const response = await fetch('/api/prize-pool?poolId=1&chainId=8453');
const data = await response.json();

console.log('Pool:', data.pool);
```

### POST /api/prize-pool

Fetch winners for a specific event:

```typescript
const response = await fetch('/api/prize-pool', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: 1, chainId: 8453 }),
});

const data = await response.json();
console.log('Winners:', data.winners);
```

## Roles and Permissions

- **HOST_ROLE**: Can create pools and request payouts
- **JUDGE_ROLE**: Can approve payouts (requires multiple signatures)
- **ADMIN_ROLE**: Full control including emergency withdrawals

## Events

The contract emits the following events:

- `PoolCreated`: When a new pool is created
- `PoolFunded`: When funds are added to a pool
- `PayoutRequested`: When a payout is requested
- `PayoutApproved`: When a judge approves a payout
- `PayoutExecuted`: When payout is completed
- `EmergencyWithdrawInitiated`: When emergency withdrawal starts
- `EmergencyWithdrawExecuted`: When emergency withdrawal completes

## Security Notes

1. Always verify pool details before funding
2. Multi-signature approval protects against unauthorized payouts
3. Emergency withdrawals have a time lock for safety
4. All token transfers are protected by ReentrancyGuard


