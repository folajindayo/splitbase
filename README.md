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
- **🔒 Custodial Escrow System**: Platform holds funds securely as trusted intermediary - automatic funding detection, secure key encryption, no smart contracts required

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

1. Get a WalletConnect Project ID:
   - Go to [https://cloud.reown.com](https://cloud.reown.com) (WalletConnect Cloud)
   - Create a new project
   - Copy your Project ID
   - See the [WalletConnect Documentation](https://docs.walletconnect.network/) for more details

2. Setup Supabase:
   - Create a project at [https://supabase.com](https://supabase.com)
   - Run the SQL migrations in order:
     1. First, run `supabase-schema.sql` to create the base tables
     2. Then run `supabase-migration.sql` to add additional fields
     3. Run `supabase-templates-migration.sql` to add template support
     4. Run `supabase-email-migration.sql` to add email notifications
     5. Run `supabase-escrow-migration.sql` to add escrow system tables
   
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

## 🔒 Custodial Escrow System

SplitBase includes a **custodial escrow system** where the platform acts as a trusted intermediary, securely holding funds until release conditions are met. This provides security without smart contract complexity.

### How Custody Works

When you create an escrow:
1. **Unique Wallet Generated**: Each escrow gets its own secure wallet
2. **Encrypted Storage**: Private keys are encrypted and stored securely
3. **Automatic Detection**: System detects when funds are deposited
4. **Controlled Release**: Only the buyer can release funds to seller
5. **No User Keys**: Your private key is never needed or exposed

See [CUSTODY_SYSTEM.md](./CUSTODY_SYSTEM.md) for detailed security documentation.

### Creating an Escrow

1. Connect your wallet and navigate to the **Escrow** page
2. Click "Create Escrow"
3. **Step 1: Basic Information**
   - Enter escrow title and description
   - Provide seller's address (or ENS/Basename)
   - Set the total amount and currency
4. **Step 2: Choose Escrow Type**
   - **Simple Escrow**: Buyer deposits, seller delivers, buyer releases
   - **Time-Locked Escrow**: Same as simple but with auto-release after a deadline
   - **Milestone Escrow**: Release funds in stages as milestones are completed
5. **Step 3: Configuration**
   - For time-locked: Set release date and enable auto-release (optional)
   - For milestone: Define milestones with titles, descriptions, and percentage splits
6. **Step 4: Review & Create**
   - Review all details and create the escrow agreement
   - System generates secure custody wallet automatically

### Escrow Types

**Simple Escrow:**
- Buyer creates escrow and deposits funds
- Seller delivers goods/services
- Buyer approves and releases payment
- Best for straightforward transactions

**Time-Locked Escrow:**
- Same as simple escrow with a deadline
- Funds can be released after the specified date
- Optional auto-release feature
- Protects both parties with time constraints

**Milestone Escrow:**
- Payment released in stages (e.g., 25%, 50%, 25%)
- Seller completes each milestone
- Buyer reviews and releases payment for each stage
- Perfect for long-term projects and phased deliveries

### Using Escrow as a Buyer

1. **Create Escrow**: Set up the agreement with seller details
2. **Receive Custody Wallet**: Get a unique deposit address with QR code
3. **Deposit Funds**: Send the agreed amount to the custody wallet address
4. **Automatic Confirmation**: System detects and confirms your deposit automatically
5. **Wait for Delivery**: Seller completes the work/delivers goods
6. **Release Funds**: Approve release when satisfied with delivery
   - Funds are sent automatically from custody wallet to seller
   - Gas fees calculated and deducted automatically

For milestone escrows:
- Review each completed milestone
- Release payment stage by stage
- Track progress with visual milestone tracker

**Benefits of Custody:**
- ✅ No transaction hash needed - automatic detection
- ✅ Real-time balance monitoring with QR code
- ✅ Secure encryption of wallet keys
- ✅ Platform handles gas optimization
- ✅ Simple one-click release

### Using Escrow as a Seller

1. **Receive Notification**: Get notified when an escrow is created
2. **Wait for Funding**: Buyer deposits the agreed amount
3. **Deliver Work**: Complete the work or deliver goods/services
4. **Request Release**: 
   - For simple/time-locked: Wait for buyer to release
   - For milestone: Mark milestones as completed for buyer review

### Escrow Dashboard

The escrow dashboard provides:
- **Filter by Role**: View escrows where you're the buyer or seller
- **Filter by Status**: See active, completed, or all escrows
- **Search**: Find escrows by title, description, or addresses
- **Statistics**: Track total escrows, amounts, and completion rates
- **Quick Actions**: View details, release funds, or manage escrows

### Escrow Security

- **No Custody**: Funds are sent directly to seller's address (we only track agreements)
- **Database Tracking**: Escrow logic stored in database, not blockchain
- **Activity Logging**: All actions recorded with timestamps and actor addresses
- **Email Notifications**: Optional alerts for key events (funded, released, milestones)
- **Transparent**: All parties can view escrow status and activity log

### Important Notes

- This escrow system **does not hold funds** - it tracks agreements only
- Funds are sent directly to the seller's address
- Both parties should agree to use SplitBase for tracking before creating an escrow
- The system is designed for trust-minimized transactions with clear deliverables

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

### External Documentation
- [Base Documentation](https://docs.base.org)
- [WalletConnect Documentation](https://docs.walletconnect.network/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

### SplitBase Documentation
- [WalletConnect Integration Guide](./WALLETCONNECT_INTEGRATION.md) - How we integrate with WalletConnect
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - New features technical details
- [Quick Start Guide](./QUICK_START.md) - Get started in 5 minutes

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built on **Base** blockchain
- Powered by **WalletConnect** (via Reown AppKit)
- UI styled with **Tailwind CSS**
- Database by **Supabase**
- Smart contracts secured with **OpenZeppelin**

For more information, visit the [WalletConnect Documentation](https://docs.walletconnect.network/)

## 🎮 Smart Contracts

### PrizePoolEscrow Contract

**Contract Address (Base):** `0xFe3989D74711b1dda30cf4a52F3DE14392185097`

Multi-signature escrow contract for secure hackathon and grant prize management on Base network.

#### Features
- **Multi-signature approval system** for prize distribution
- **Support for native tokens (ETH) and ERC20 tokens**
- **Time-locked emergency withdrawal** mechanism
- **Role-based access control** (Host, Judge, Admin)
- **Prize pool creation and management** per event
- **Batch payouts** for multiple winners
- **Audit trail** with comprehensive event logging
- **Dispute resolution** with time-lock protection

#### Key Functions
- `createPrizePool()` - Create a new prize pool for an event
- `fundPool()` - Add funds to an existing pool
- `requestPayout()` - Request prize distribution to winners
- `approvePayout()` - Multi-sig approval of payout requests
- `getPoolDetails()` - View pool information
- `getEventWinners()` - Get list of winners for an event

#### Contract ABI
The complete ABI is available in [`abi.ts`](./abi.ts) at the project root.

#### Usage Example

```typescript
import { PRIZE_POOL_ESCROW_ABI, PRIZE_POOL_ESCROW_ADDRESS } from './abi';

// Example: Create a prize pool
const createPool = async () => {
  const tx = await contract.createPrizePool(
    eventId,
    tokenAddress, // or address(0) for ETH
    2, // required signatures
    { value: ethers.parseEther("1.0") }
  );
  await tx.wait();
};
```

#### Integration Documentation

**📚 Complete Integration Guide**: See [`PRIZE_POOL_INTEGRATION.md`](./PRIZE_POOL_INTEGRATION.md) for:
- React hook usage (`usePrizePool`)
- API route documentation
- Complete code examples
- Event handling
- Security best practices

**Integration Files**:
- `/app/lib/contracts.ts` - Contract function implementations
- `/app/hooks/usePrizePool.ts` - React hook for UI integration
- `/app/api/prize-pool/route.ts` - Server-side API endpoint

