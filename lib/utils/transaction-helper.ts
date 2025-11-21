/**
 * Transaction Helper
 */

export function formatTxHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function getTxExplorerUrl(chainId: number, hash: string): string {
  const baseUrls: Record<number, string> = {
    8453: 'https://basescan.org',
    84532: 'https://sepolia.basescan.org',
  };
  
  const baseUrl = baseUrls[chainId];
  return baseUrl ? `${baseUrl}/tx/${hash}` : '';
}

export function waitForTransaction(
  hash: string,
  confirmations: number = 1
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), confirmations * 2000);
  });
}

