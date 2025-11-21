/**
 * Payment Configuration
 */

export const PAYMENT_CONFIG = {
  MIN_SPLIT_AMOUNT: '0.001',
  MAX_SPLIT_AMOUNT: '1000000',
  PLATFORM_FEE_PERCENTAGE: 1,
  GAS_BUFFER_MULTIPLIER: 1.2,
  CONFIRMATION_BLOCKS: 2,
  SUPPORTED_TOKENS: [
    {
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
    },
    {
      symbol: 'USDC',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
    },
    {
      symbol: 'DAI',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
    },
  ],
} as const;

