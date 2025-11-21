/**
 * Payment Configuration
 */

export const paymentConfig = {
  platformFeePercentage: 0.5, // 0.5%
  minAmount: '0.001', // ETH
  maxAmount: '10000', // ETH
  maxRecipients: 100,
  minRecipients: 2,
  
  gas: {
    baseGas: 21000,
    perRecipientGas: 5000,
    maxGasPrice: '1000', // Gwei
  },
  
  confirmations: {
    required: 2,
    timeout: 600000, // 10 minutes
  },
  
  retryPolicy: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
  },
  
  supportedChains: [1, 137, 56, 42161, 10], // Ethereum, Polygon, BSC, Arbitrum, Optimism
  
  endpoints: {
    create: '/api/splits/create',
    execute: '/api/splits/[id]/execute',
    status: '/api/splits/[id]',
  },
};

export const blockchainConfig = {
  rpcUrls: {
    1: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2',
    137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    56: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
  },
};
