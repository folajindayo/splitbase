import { BrowserProvider, Contract, JsonRpcSigner, formatEther } from "ethers";

import { CHAIN_IDS } from "./constants";

// Contract ABIs
export const SPLIT_FACTORY_ABI = [
  "function createSplit(address[] memory _recipients, uint256[] memory _percentages) external returns (address)",
  "function getSplitsByOwner(address owner) external view returns (address[] memory)",
  "function getAllSplitsCount() external view returns (uint256)",
  "function isValidSplit(address splitAddress) external view returns (bool)",
  "event SplitCreated(address indexed splitAddress, address indexed owner, address[] recipients, uint256[] percentages, uint256 timestamp)",
];

export const SPLIT_BASE_ABI = [
  "function recipients(uint256) external view returns (address)",
  "function percentages(uint256) external view returns (uint256)",
  "function owner() external view returns (address)",
  "function totalDistributed() external view returns (uint256)",
  "function getRecipientsCount() external view returns (uint256)",
  "function getSplitDetails() external view returns (address[] memory, uint256[] memory)",
  "function getRecipient(uint256 index) external view returns (address recipient, uint256 percentage)",
  "function distribute() external",
  "event FundsReceived(address indexed from, uint256 amount)",
  "event FundsDistributed(uint256 amount, uint256 timestamp)",
  "event RecipientPaid(address indexed recipient, uint256 amount)",
  "receive() external payable",
];

// Get factory contract address based on chain
export function getFactoryAddress(chainId: number): string {
  if (chainId === CHAIN_IDS.BASE_SEPOLIA) {
    return process.env.NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_SEPOLIA || "";
  } else if (chainId === CHAIN_IDS.BASE_MAINNET) {
    return process.env.NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_BASE || "";
  }
  throw new Error(`Unsupported chain ID: ${chainId}`);
}

// Get factory contract instance
export function getFactoryContract(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  chainId: number
): Contract {
  const address = getFactoryAddress(chainId);
  return new Contract(address, SPLIT_FACTORY_ABI, signerOrProvider);
}

// Get split contract instance
export function getSplitContract(
  address: string,
  signerOrProvider: JsonRpcSigner | BrowserProvider
): Contract {
  return new Contract(address, SPLIT_BASE_ABI, signerOrProvider);
}

// Create a new split contract
export async function createSplit(
  signer: JsonRpcSigner,
  chainId: number,
  recipients: string[],
  percentages: number[]
): Promise<{ splitAddress: string; txHash: string }> {
  const factory = getFactoryContract(signer, chainId);
  
  const tx = await factory.createSplit(recipients, percentages);
  const receipt = await tx.wait();

  // Parse the SplitCreated event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed?.name === "SplitCreated";
    } catch {
      return false;
    }
  });

  if (!event) {
    throw new Error("SplitCreated event not found");
  }

  const parsed = factory.interface.parseLog(event);
  const splitAddress = parsed?.args[0];

  return {
    splitAddress,
    txHash: receipt.hash,
  };
}

// Get splits owned by an address
export async function getSplitsByOwner(
  provider: BrowserProvider,
  chainId: number,
  ownerAddress: string
): Promise<string[]> {
  const factory = getFactoryContract(provider, chainId);
  return await factory.getSplitsByOwner(ownerAddress);
}

// Get split details
export async function getSplitDetails(
  provider: BrowserProvider,
  splitAddress: string
): Promise<{
  recipients: string[];
  percentages: bigint[];
  owner: string;
  balance: string;
  totalDistributed: string;
}> {
  const split = getSplitContract(splitAddress, provider);
  
  const [recipients, percentages] = await split.getSplitDetails();
  const owner = await split.owner();
  const totalDistributed = await split.totalDistributed();
  const balance = await provider.getBalance(splitAddress);

  return {
    recipients,
    percentages,
    owner,
    balance: formatEther(balance),
    totalDistributed: formatEther(totalDistributed),
  };
}

// Distribute funds manually
export async function distributeFunds(
  signer: JsonRpcSigner,
  splitAddress: string
): Promise<string> {
  const split = getSplitContract(splitAddress, signer);
  const tx = await split.distribute();
  const receipt = await tx.wait();
  return receipt.hash;
}

// Send ETH to split contract
export async function depositToSplit(
  signer: JsonRpcSigner,
  splitAddress: string,
  amountInEth: string
): Promise<string> {
  const tx = await signer.sendTransaction({
    to: splitAddress,
    value: amountInEth,
  });
  const receipt = await tx.wait();
  return receipt?.hash || tx.hash;
}

// Get split balance
export async function getSplitBalance(
  provider: BrowserProvider,
  splitAddress: string
): Promise<string> {
  const balance = await provider.getBalance(splitAddress);
  return formatEther(balance);
}

// =============================================================================
// PRIZE POOL ESCROW CONTRACT
// =============================================================================

// Import the ABI from the root
import { PRIZE_POOL_ESCROW_ABI, PRIZE_POOL_ESCROW_ADDRESS } from "../../abi";

// Prize Pool status enum
export enum PoolStatus {
  Active = 0,
  Locked = 1,
  Completed = 2,
  Cancelled = 3,
}

// Payout status enum
export enum PayoutStatus {
  Pending = 0,
  Approved = 1,
  Executed = 2,
  Rejected = 3,
}

// Get Prize Pool Escrow contract instance
export function getPrizePoolContract(
  signerOrProvider: JsonRpcSigner | BrowserProvider
): Contract {
  return new Contract(
    PRIZE_POOL_ESCROW_ADDRESS,
    PRIZE_POOL_ESCROW_ABI,
    signerOrProvider
  );
}

// Create a new prize pool
export async function createPrizePool(
  signer: JsonRpcSigner,
  eventId: number,
  tokenAddress: string, // address(0) for native ETH
  requiredSignatures: number,
  initialAmountEth?: string // optional initial funding for native ETH
): Promise<{ poolId: bigint; txHash: string }> {
  const contract = getPrizePoolContract(signer);
  
  const tx = await contract.createPrizePool(
    eventId,
    tokenAddress,
    requiredSignatures,
    { value: initialAmountEth ? initialAmountEth : "0" }
  );
  const receipt = await tx.wait();

  // Parse the PoolCreated event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "PoolCreated";
    } catch {
      return false;
    }
  });

  if (!event) {
    throw new Error("PoolCreated event not found");
  }

  const parsed = contract.interface.parseLog(event);
  const poolId = parsed?.args[0];

  return {
    poolId,
    txHash: receipt.hash,
  };
}

// Fund an existing pool
export async function fundPrizePool(
  signer: JsonRpcSigner,
  poolId: number,
  amount: string, // For ERC20 tokens
  amountEth?: string // For native ETH
): Promise<string> {
  const contract = getPrizePoolContract(signer);
  
  const tx = await contract.fundPool(
    poolId,
    amount || "0",
    { value: amountEth || "0" }
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

// Request payout from pool
export async function requestPayout(
  signer: JsonRpcSigner,
  poolId: number,
  recipients: string[],
  amounts: string[],
  reason: string
): Promise<{ payoutId: bigint; txHash: string }> {
  const contract = getPrizePoolContract(signer);
  
  const tx = await contract.requestPayout(poolId, recipients, amounts, reason);
  const receipt = await tx.wait();

  // Parse the PayoutRequested event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "PayoutRequested";
    } catch {
      return false;
    }
  });

  if (!event) {
    throw new Error("PayoutRequested event not found");
  }

  const parsed = contract.interface.parseLog(event);
  const payoutId = parsed?.args[0];

  return {
    payoutId,
    txHash: receipt.hash,
  };
}

// Approve a payout (requires JUDGE_ROLE or ADMIN_ROLE)
export async function approvePayout(
  signer: JsonRpcSigner,
  payoutId: number
): Promise<string> {
  const contract = getPrizePoolContract(signer);
  
  const tx = await contract.approvePayout(payoutId);
  const receipt = await tx.wait();
  return receipt.hash;
}

// Get pool details
export async function getPoolDetails(
  provider: BrowserProvider,
  poolId: number
): Promise<{
  eventId: bigint;
  host: string;
  totalAmount: bigint;
  remainingAmount: bigint;
  tokenAddress: string;
  status: PoolStatus;
  requiredSignatures: bigint;
}> {
  const contract = getPrizePoolContract(provider);
  
  const details = await contract.getPoolDetails(poolId);
  
  return {
    eventId: details[0],
    host: details[1],
    totalAmount: details[2],
    remainingAmount: details[3],
    tokenAddress: details[4],
    status: details[5],
    requiredSignatures: details[6],
  };
}

// Get event winners
export async function getEventWinners(
  provider: BrowserProvider,
  eventId: number
): Promise<Array<{
  recipient: string;
  amount: bigint;
  rank: bigint;
  projectName: string;
  paidAt: bigint;
}>> {
  const contract = getPrizePoolContract(provider);
  
  const winners = await contract.getEventWinners(eventId);
  
  return winners.map((winner: any) => ({
    recipient: winner.recipient,
    amount: winner.amount,
    rank: winner.rank,
    projectName: winner.projectName,
    paidAt: winner.paidAt,
  }));
}

// Refund pool (only if no payouts made)
export async function refundPool(
  signer: JsonRpcSigner,
  poolId: number
): Promise<string> {
  const contract = getPrizePoolContract(signer);
  
  const tx = await contract.refundPool(poolId);
  const receipt = await tx.wait();
  return receipt.hash;
}

