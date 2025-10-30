# SplitBase

**Onchain split payment dashboard powered by Reown (WalletConnect) and Base**

SplitBase allows creators, teams, and DAOs to receive payments into a single wallet address and automatically split the funds among multiple members according to predefined percentages.

## 🚀 Features

- **Wallet Authentication**: Connect via Reown (WalletConnect)
- **Smart Contract Factory**: Deploy split contracts on Base
- **Auto Distribution**: Funds automatically split when received
- **Dashboard**: View and manage all your split contracts
- **Transaction History**: Track all distributions on-chain
- **Base Network**: Deployed on Base Sepolia (testnet) and Base Mainnet

## 📁 Project Structure

```
/splitbase
├── contracts/          # Smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── SplitBase.sol
│   │   └── SplitFactory.sol
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.ts
├── app/               # Frontend (Next.js 14)
│   ├── app/
│   │   ├── dashboard/
│   │   ├── splits/
│   │   └── api/
│   ├── components/
│   └── lib/
└── README.md
```

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity** ^0.8.20
- **Hardhat** for development
- **OpenZeppelin** for security
- **Base** blockchain (Sepolia & Mainnet)

### Frontend
- **Next.js 14** with App Router
- **TypeScript**
- **Tailwind CSS** for styling
- **Reown AppKit** for wallet connection
- **ethers.js v6** for blockchain interaction
- **Supabase** for database

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- A wallet with Base Sepolia ETH (get from [Base faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd splitbase
```

### 2. Install Smart Contract Dependencies
```bash
cd contracts
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../app
npm install
```

## ⚙️ Configuration

### Smart Contracts

1. Create `contracts/.env`:
```bash
PRIVATE_KEY=your_private_key_without_0x
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_basescan_api_key
```

2. Compile contracts:
```bash
cd contracts
npm run compile
```

3. Run tests:
```bash
npm test
```

4. Deploy to Base Sepolia:
```bash
npm run deploy:sepolia
```

### Frontend

1. Get a Reown Project ID:
   - Go to [https://cloud.reown.com](https://cloud.reown.com)
   - Create a new project
   - Copy your Project ID

2. Setup Supabase:
   - Create a project at [https://supabase.com](https://supabase.com)
   - Run the following SQL to create tables:

```sql
-- Create splits table
CREATE TABLE splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT NOT NULL UNIQUE,
  owner_address TEXT NOT NULL,
  factory_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipients table
CREATE TABLE recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100)
);

-- Create indexes
CREATE INDEX idx_splits_owner ON splits(owner_address);
CREATE INDEX idx_splits_contract ON splits(contract_address);
CREATE INDEX idx_recipients_split ON recipients(split_id);
```

3. Create `app/.env.local`:
```bash
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_SEPOLIA=deployed_factory_address
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_BASE=deployed_factory_address
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532
```

4. Run development server:
```bash
cd app
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🚀 Usage

### Creating a Split

1. Connect your wallet
2. Click "Create New Split"
3. Add recipient addresses and percentages (must sum to 100%)
4. Click "Deploy Split"
5. Confirm the transaction in your wallet

### Sending Funds to a Split

Simply send ETH to the split contract address. Funds will automatically distribute to all recipients based on their percentages.

### Manual Distribution

If needed, you can manually trigger distribution by clicking "Distribute Now" on the split details page.

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
npm test
```

### Frontend (Manual Testing)
1. Deploy contracts to Base Sepolia
2. Update `.env.local` with contract addresses
3. Run `npm run dev`
4. Test wallet connection, split creation, and fund distribution

## 📝 Smart Contract Details

### SplitFactory
- Deploys new SplitBase contracts
- Tracks all created splits
- Maps owners to their splits

### SplitBase
- Stores recipients and percentages
- Auto-distributes on receive
- Manual distribute function
- Emits events for tracking

## 🔒 Security

- Uses OpenZeppelin's ReentrancyGuard
- All percentages validated to sum to 100
- No admin functions after deployment
- All transactions are on-chain and verifiable

## 📚 Resources

- [Base Documentation](https://docs.base.org)
- [Reown AppKit Docs](https://docs.reown.com/appkit/overview)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built on Base
- Powered by Reown (WalletConnect)
- UI styled with Tailwind CSS
- Database by Supabase

