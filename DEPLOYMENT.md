# SplitBase Deployment Guide

This guide will walk you through deploying SplitBase from scratch.

## Prerequisites

- Node.js 18+ and npm installed
- A wallet with Base Sepolia ETH ([Get from Base faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
- Git installed

## Step 1: Smart Contract Deployment

### 1.1 Setup Environment

```bash
cd contracts
cp .env.example .env
```

Edit `contracts/.env` and add:
- `PRIVATE_KEY`: Your wallet's private key (without 0x prefix)
- `BASESCAN_API_KEY`: Get from [BaseScan](https://basescan.org/apis)

### 1.2 Compile Contracts

```bash
npm install
npm run compile
```

### 1.3 Run Tests

```bash
npm test
```

You should see all 15 tests passing.

### 1.4 Deploy to Base Sepolia

```bash
npm run deploy:sepolia
```

**Important:** Save the deployed `SplitFactory` address - you'll need it for the frontend.

### 1.5 Verify Contract (Optional but Recommended)

```bash
npx hardhat verify --network baseSepolia <FACTORY_ADDRESS>
```

## Step 2: Supabase Setup

### 2.1 Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose a name, database password, and region
4. Wait for the project to initialize

### 2.2 Create Database Tables

1. In your Supabase project, go to "SQL Editor"
2. Click "New Query"
3. Copy the contents of `supabase-schema.sql`
4. Paste and click "Run"
5. Verify tables were created in "Table Editor"

### 2.3 Get API Credentials

1. Go to "Project Settings" → "API"
2. Copy:
   - `Project URL`
   - `anon` `public` key

## Step 3: Reown (WalletConnect) Setup

### 3.1 Create Project

1. Go to [cloud.reown.com](https://cloud.reown.com)
2. Sign up or log in
3. Click "Create New Project"
4. Choose a name (e.g., "SplitBase")
5. Copy your `Project ID`

## Step 4: Frontend Configuration

### 4.1 Setup Environment

```bash
cd ../app
cp .env.example .env.local
```

Edit `app/.env.local`:

```env
# From Reown
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id

# From Step 1.4 (Contract Deployment)
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_SEPOLIA=0x...
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_BASE=  # Leave empty for now

# From Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Network (84532 = Base Sepolia)
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532
```

### 4.2 Install Dependencies

```bash
npm install
```

### 4.3 Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 5: Test the Application

### 5.1 Connect Wallet

1. Click "Connect Wallet" in the navigation
2. Choose your wallet (MetaMask, Coinbase Wallet, etc.)
3. Switch to Base Sepolia network if needed
4. Approve the connection

### 5.2 Create a Split

1. Click "Create New Split"
2. Add at least 2 recipients with wallet addresses
3. Set percentages that sum to 100%
4. Click "Deploy Split"
5. Confirm the transaction in your wallet
6. Wait for deployment (usually 2-5 seconds)

### 5.3 Test Fund Distribution

1. Copy the split contract address
2. Send test ETH to that address from your wallet
3. Check that funds were distributed to recipients
4. View transaction on BaseScan

## Step 6: Deploy to Production (Vercel)

### 6.1 Push to GitHub

```bash
cd ..
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 6.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `app`
5. Add environment variables (same as `.env.local`)
6. Click "Deploy"

### 6.3 Deploy to Base Mainnet (Production)

⚠️ **Only do this after thorough testing on Sepolia!**

```bash
cd contracts
npm run deploy:base
```

Update your Vercel environment variables:
- `NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_BASE` with the mainnet address
- `NEXT_PUBLIC_DEFAULT_CHAIN_ID=8453` (Base Mainnet)

Redeploy on Vercel.

## Troubleshooting

### Contract Deployment Fails

- **Insufficient funds**: Get more Base Sepolia ETH from faucet
- **Gas estimation error**: The RPC might be slow, try again
- **Nonce too high**: Reset your MetaMask account

### Frontend Can't Connect to Wallet

- **Check Network**: Make sure you're on Base Sepolia (Chain ID: 84532)
- **Reown Project ID**: Verify it's correct in `.env.local`
- **Clear Cache**: Try clearing browser cache and reloading

### Database Errors

- **Table not found**: Run the SQL schema again
- **RLS policies**: Make sure Row Level Security policies were created
- **API key**: Verify you're using the `anon` key, not the `service_role` key

### Contract Interaction Fails

- **Wrong Network**: Switch to Base Sepolia in your wallet
- **Wrong Address**: Verify factory address in `.env.local`
- **Insufficient Gas**: Make sure you have enough ETH for gas

## Monitoring

### Check Contract Activity

- **Base Sepolia**: https://sepolia.basescan.org/address/YOUR_FACTORY_ADDRESS
- **Base Mainnet**: https://basescan.org/address/YOUR_FACTORY_ADDRESS

### Check Database

Use Supabase Table Editor to view:
- Number of splits created
- Total recipients
- Recent activity

### Check Frontend Logs

- Vercel Dashboard → Your Project → Functions
- Browser Console (F12) for client-side errors

## Security Considerations

### For Production:

1. **Environment Variables**: Never commit `.env` files
2. **Database Security**: Implement proper RLS policies with authentication
3. **Contract Verification**: Always verify contracts on BaseScan
4. **Audit**: Consider a security audit before mainnet
5. **Rate Limiting**: Add rate limiting to API routes
6. **Input Validation**: Already implemented but review carefully

## Costs

### Development (Base Sepolia):
- **Testnet ETH**: Free from faucet
- **Supabase**: Free tier (500MB database)
- **Vercel**: Free tier (hobby projects)
- **Reown**: Free tier (up to 100k requests/month)

### Production (Base Mainnet):
- **Contract Deployment**: ~$0.50-2 (one-time)
- **Creating a Split**: ~$0.10-0.50 per split
- **Distribution**: ~$0.05-0.20 per distribution
- **Infrastructure**: Same as development if staying in free tiers

## Next Steps

- Add custom domains in Vercel
- Implement user authentication
- Add email notifications for distributions
- Create analytics dashboard
- Add ENS name resolution
- Support ERC20 tokens (USDC, etc.)

## Support

If you encounter issues:

1. Check the [README.md](README.md) for detailed documentation
2. Review contract tests: `cd contracts && npm test`
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

## License

MIT

