# SplitBase Quick Start Guide

Get SplitBase running locally in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- Base Sepolia ETH in your wallet ([Get from faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

## 1. Install Dependencies (2 min)

```bash
# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../app
npm install
```

## 2. Deploy Smart Contracts (3 min)

```bash
cd ../contracts

# Create environment file
cp .env.example .env

# Edit .env and add your PRIVATE_KEY (without 0x)
# You can leave other fields empty for now

# Compile contracts
npm run compile

# Run tests (optional but recommended)
npm test

# Deploy to Base Sepolia
npm run deploy:sepolia

# ✅ SAVE THE FACTORY ADDRESS from output!
```

## 3. Setup Supabase (3 min)

1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project (choose any name)
3. Go to SQL Editor → New Query
4. Copy contents of `supabase-schema.sql` and run
5. Go to Project Settings → API
6. Copy `Project URL` and `anon public` key

## 4. Get Reown Project ID (1 min)

1. Go to [cloud.reown.com](https://cloud.reown.com)
2. Create account and new project
3. Copy your `Project ID`

## 5. Configure Frontend (1 min)

```bash
cd app

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values:
# - NEXT_PUBLIC_REOWN_PROJECT_ID (from step 4)
# - NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_SEPOLIA (from step 2)
# - NEXT_PUBLIC_SUPABASE_URL (from step 3)
# - NEXT_PUBLIC_SUPABASE_ANON_KEY (from step 3)
```

## 6. Run Application

```bash
npm run dev
```

Open http://localhost:3000 🎉

## Quick Test

1. **Connect Wallet**: Click "Connect Wallet" button
2. **Create Split**: 
   - Add 2+ recipients
   - Set percentages (must sum to 100%)
   - Deploy
3. **Send Funds**: Send 0.001 ETH to your split address
4. **Verify**: Check recipients received funds on BaseScan

## Troubleshooting

**"Insufficient funds"**: Get more Sepolia ETH from faucet

**"Cannot connect wallet"**: Make sure you're on Base Sepolia network (Chain ID: 84532)

**"Module not found"**: Run `npm install` in both `contracts/` and `app/` directories

**Database error**: Verify Supabase SQL was executed successfully

## What's Next?

- See [README.md](README.md) for complete documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Check `contracts/test/` for contract tests
- Explore the code in `app/components/` and `contracts/contracts/`

## Architecture Overview

```
User → Frontend (Next.js) → Smart Contracts (Base) → Auto-distribute
           ↓
       Database (Supabase) - Stores split metadata
```

## Key Files

```
/contracts
  /contracts/SplitFactory.sol   - Creates split contracts
  /contracts/SplitBase.sol       - Individual split logic
  /test/SplitBase.test.ts        - Contract tests

/app
  /app/page.tsx                  - Landing page
  /app/dashboard/page.tsx        - User dashboard
  /app/splits/[address]/page.tsx - Split details
  /components/CreateSplitModal.tsx - Split creation UI
  /lib/contracts.ts              - Blockchain interactions
  /lib/supabase.ts               - Database client
```

## Need Help?

1. Run tests: `cd contracts && npm test`
2. Check browser console (F12)
3. Verify all environment variables are set
4. Make sure wallet is on Base Sepolia

Happy splitting! 🚀

