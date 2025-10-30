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

