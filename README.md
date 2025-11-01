# SplitBase

**Onchain split payment dashboard powered by Reown (WalletConnect) and Base**

SplitBase allows creators, teams, and DAOs to receive payments into a single wallet address and automatically split the funds among multiple members according to predefined percentages.

## 🚀 Features

### Core Features
- **Wallet Authentication**: Connect via Reown (WalletConnect)
- **Smart Contract Factory**: Deploy split contracts on Base
- **Auto Distribution**: Funds automatically split when received
- **Dashboard**: View and manage all your split contracts
- **Transaction History**: Track all distributions on-chain
- **Base Network**: Deployed on Base Sepolia (testnet) and Base Mainnet

### New Features ✨
- **📋 Split Templates**: Pre-configured templates (50/50, thirds, team splits) and save custom templates for reuse
- **📱 QR Code Generation**: Generate and download QR codes for easy payment sharing
- **📊 Export to CSV**: Export split data and transaction history to CSV files
- **🏷️ ENS/Basename Support**: Use ENS names (e.g., vitalik.eth) or Basenames instead of addresses
- **📧 Email Notifications**: Get notified via email when distributions occur (optional)

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
   - Run the SQL migrations in order:
     1. First, run `supabase-schema.sql` to create the base tables
     2. Then run `supabase-migration.sql` to add additional fields
     3. Run `supabase-templates-migration.sql` to add template support
     4. Run `supabase-email-migration.sql` to add email notifications
   
   Or use the combined schema below:

```sql
-- See supabase-schema.sql, supabase-migration.sql, 
-- supabase-templates-migration.sql, and supabase-email-migration.sql
-- in the project root for the complete database schema
```

3. Setup Email Notifications (Optional):
   - Sign up for [Resend](https://resend.com) (free tier available)
   - Get your API key from the dashboard
   - Verify your sending domain (or use their test domain for development)

4. Create `app/.env.local`:
```bash
# Required
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_SEPOLIA=deployed_factory_address
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_BASE=deployed_factory_address
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532

# Optional - Email Notifications
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL="SplitBase <notifications@yourdomain.com>"
```

5. Run development server:
```bash
cd app
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 🚀 Usage

### Creating a Split

1. Connect your wallet
2. Click "Create New Split"
3. **Option 1**: Add recipient addresses manually
   - Enter addresses or ENS/Basename (e.g., `vitalik.eth`, `name.base.eth`)
   - Set percentages (must sum to 100%)
4. **Option 2**: Use a template
   - Click "Use Template" button
   - Choose from preset templates (50/50, thirds, etc.)
   - Or select one of your saved custom templates
5. *Optional*: Enable email notifications
6. Click "Deploy Split"
7. Confirm the transaction in your wallet

### Using Templates

**Preset Templates:**
- 50/50 Split
- Equal Thirds
- Team Revenue (4 members)
- Creator Split (80/20)
- DAO Treasury Split
- Founder Split (3 members)

**Custom Templates:**
- Save your current split configuration as a template
- Reuse templates across multiple splits
- Delete templates you no longer need

### Sending Funds to a Split

Simply send ETH to the split contract address. Funds will automatically distribute to all recipients based on their percentages.

### Sharing Your Split

1. **QR Code**: Click "Show QR" to generate a scannable QR code
   - Download the QR code image
   - Share with others for easy payments
2. **Copy Address**: Click "Copy Address" to copy the contract address
3. **Share Link**: Share the split page URL directly

### Exporting Data

- **Single Split**: Click "Export" on a split details page to export that split's data
- **All Splits**: Click "Export CSV" on the dashboard to export all your splits
- **Recipients**: Export detailed recipient information across all splits

### Email Notifications

When enabled, you'll receive emails for:
- Payment distributions (amount, transaction hash, your share)
- New split contract deployments
- Transaction confirmations

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

