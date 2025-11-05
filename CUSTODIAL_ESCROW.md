# Custodial Escrow System

## Overview

SplitBase's custodial escrow system acts as a **trust layer** for secure payment transactions between buyers and sellers. Unlike traditional escrow services that rely on smart contracts, our system uses a **custodial wallet** where funds are held securely until release conditions are met.

## 🔒 How It Works

### 1. **Escrow Creation**
- Buyer or seller creates an escrow agreement
- Escrow details include: title, amount, parties, type, and milestones (if applicable)
- A unique payment reference is generated for tracking

### 2. **Funding (Buyer)**
- Buyer sends funds to **SplitBase's custodial wallet address**
- Funds are sent on-chain (blockchain transaction)
- Buyer submits the transaction hash for verification

### 3. **Blockchain Verification**
- System verifies the transaction on the blockchain
- Checks:
  - ✅ Transaction is confirmed
  - ✅ Amount matches escrow amount
  - ✅ Funds were sent to correct custodial address
- If valid, escrow is marked as "funded"

### 4. **Work/Delivery (Seller)**
- Seller completes work or delivers goods/services
- For milestone escrows, seller completes each milestone

### 5. **Release Approval (Buyer)**
- Buyer reviews and approves the delivery
- Buyer clicks "Release Funds"
- For milestone escrows, buyer releases each milestone individually

### 6. **Fund Distribution**
- SplitBase releases funds from custodial wallet to seller
- Transaction recorded in activity log
- Email notifications sent (if enabled)

## 💼 Trust Model

### SplitBase as Trust Layer

**What we hold:**
- ✅ Custody of funds in secure wallet
- ✅ Escrow agreement details
- ✅ Milestone and activity records

**What you retain:**
- ✅ Full approval control (buyer)
- ✅ Transparent activity log
- ✅ Ability to dispute
- ✅ On-chain transaction proof

### Security Measures

1. **Blockchain Verification**: All deposits verified on-chain
2. **Buyer Control**: Only buyer can approve release
3. **Activity Logging**: All actions timestamped and recorded
4. **Dispute System**: Either party can open disputes
5. **Time-locks**: Auto-release option for time-based escrows

## 🔑 Technical Architecture

### Components

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Buyer     │────────▶│  Custodial       │────────▶│   Seller    │
│  (Deposit)  │         │  Wallet          │         │  (Receive)  │
└─────────────┘         │  (SplitBase)     │         └─────────────┘
                        └──────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   Database       │
                        │  - Escrows       │
                        │  - Milestones    │
                        │  - Activities    │
                        └──────────────────┘
```

### Key Files

#### Backend/Library
- **`app/lib/wallet.ts`**: Custodial wallet management, transaction verification
- **`app/lib/escrow.ts`**: Core escrow logic, CRUD operations
- **`app/lib/escrowTimeLock.ts`**: Time-locked escrow logic
- **`supabase-escrow-migration.sql`**: Database schema

#### Frontend/UI
- **`app/components/FundingInstructions.tsx`**: Deposit UI with custodial address
- **`app/components/CreateEscrowModal.tsx`**: Escrow creation wizard
- **`app/components/EscrowCard.tsx`**: Escrow summary card
- **`app/app/escrow/page.tsx`**: Escrow dashboard
- **`app/app/escrow/[id]/page.tsx`**: Escrow details page

### Database Schema

```sql
-- Custodial wallet address is stored here
escrows (
  deposit_address TEXT NOT NULL,  -- Custodial wallet
  transaction_hash TEXT,           -- Verified on blockchain
  funded_at TIMESTAMP              -- When verified
)
```

## 🚀 Setup

### 1. Generate/Configure Custodial Wallet

You'll need a secure wallet address to hold escrow funds. Options:

**Option A: Use existing wallet**
```bash
# Use a secure multi-sig or hardware wallet address
CUSTODIAL_WALLET=0x1234...5678
```

**Option B: Generate new wallet** (for testing)
```javascript
const ethers = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey); // KEEP SECURE!
```

### 2. Add to Environment Variables

```bash
# app/.env.local
NEXT_PUBLIC_CUSTODIAL_WALLET_ADDRESS=0xYourCustodialWalletAddress
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
```

### 3. Secure the Private Key

**⚠️ CRITICAL SECURITY:**
- **NEVER** commit private keys to git
- Store private key in secure key management system
- Consider using multi-sig wallets for production
- Implement proper access controls

### 4. Fund Release Process

When releasing funds, you'll need to:

1. Sign transactions from the custodial wallet
2. Send funds to seller's address
3. Update escrow status in database

*Note: Automated fund release requires a backend service with secure key management.*

## 📊 Fund Release (Admin/Backend)

### Manual Release Process

```typescript
// Example: Releasing funds from custodial wallet
import { ethers } from "ethers";

async function releaseFunds(
  escrowId: string,
  sellerAddress: string,
  amount: string
) {
  // 1. Load custodial wallet (server-side only!)
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(
    process.env.CUSTODIAL_WALLET_PRIVATE_KEY!, // NEVER expose this!
    provider
  );

  // 2. Send transaction
  const tx = await wallet.sendTransaction({
    to: sellerAddress,
    value: ethers.parseEther(amount),
  });

  // 3. Wait for confirmation
  await tx.wait();

  // 4. Update database
  await updateEscrowStatus(escrowId, 'released', tx.hash);
  
  return tx.hash;
}
```

### Automated Release API

For production, create a secure API endpoint:

```typescript
// app/api/escrow/release/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth"; // Implement authentication
import { releaseFundsFromCustody } from "@/lib/custodialRelease";

export async function POST(req: NextRequest) {
  // 1. Verify request is authenticated and authorized
  const auth = await verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Get escrow details
  const { escrowId, actorAddress } = await req.json();

  // 3. Verify actor is the buyer
  const escrow = await getEscrow(escrowId);
  if (escrow.buyer_address.toLowerCase() !== actorAddress.toLowerCase()) {
    return NextResponse.json({ error: "Only buyer can release" }, { status: 403 });
  }

  // 4. Release funds from custody
  const txHash = await releaseFundsFromCustody(
    escrow.seller_address,
    escrow.total_amount.toString()
  );

  // 5. Update escrow
  await updateEscrowAsReleased(escrowId, txHash, actorAddress);

  return NextResponse.json({ success: true, txHash });
}
```

## 🛡️ Security Best Practices

### For Development
- Use testnet (Sepolia, Base Sepolia)
- Generate test wallet for custodial address
- Fund with testnet ETH only
- Test all flows before mainnet

### For Production

1. **Wallet Security**
   - Use hardware wallet or multi-sig for custodial address
   - Implement key management system (AWS KMS, HashiCorp Vault)
   - Never store private keys in code or environment files
   - Use separate wallets for different environments

2. **Access Control**
   - Implement proper authentication for fund release
   - Use role-based access control
   - Log all release operations
   - Implement withdrawal limits

3. **Monitoring**
   - Monitor custodial wallet balance
   - Alert on unexpected transactions
   - Track all deposits and releases
   - Regular audit logs review

4. **Smart Contract Alternative** (Future)
   - For fully trustless escrow, implement smart contracts
   - Use audited escrow contract templates
   - Implement timelock mechanisms on-chain
   - Consider using established escrow protocols

## 🔄 Escrow Lifecycle

```
┌──────────────┐
│   PENDING    │ ← Escrow created
└──────┬───────┘
       │ Buyer deposits
       ▼
┌──────────────┐
│   FUNDED     │ ← Verified on blockchain
└──────┬───────┘
       │ Buyer approves
       ▼
┌──────────────┐
│   RELEASED   │ ← Funds sent to seller
└──────────────┘

Alternative paths:
- PENDING → CANCELLED (by buyer)
- FUNDED → DISPUTED (by either party)
- time_locked → RELEASED (auto-release)
```

## 📈 Monitoring & Analytics

### Key Metrics to Track

- Total escrow value in custody
- Number of active escrows
- Average time to release
- Dispute rate
- Failed transaction rate

### Database Queries

```sql
-- Total value in custody
SELECT SUM(total_amount) as total_custody
FROM escrows
WHERE status = 'funded';

-- Escrows by status
SELECT status, COUNT(*) as count
FROM escrows
GROUP BY status;

-- Average time to release
SELECT AVG(EXTRACT(EPOCH FROM (released_at - funded_at))/3600) as avg_hours
FROM escrows
WHERE status = 'released';
```

## 🆘 Dispute Resolution

When disputes arise:

1. **Freeze funds**: Keep in custodial wallet
2. **Review evidence**: Check activity log, communications
3. **Mediation**: Manual review by admin
4. **Decision**: Release to appropriate party or split

*Automated dispute resolution is not implemented. Manual intervention required.*

## ⚖️ Legal Considerations

**Important**: Custodial escrow services may have legal and regulatory requirements:

- Know Your Customer (KYC) requirements
- Anti-Money Laundering (AML) compliance
- Escrow license requirements (varies by jurisdiction)
- Terms of Service and dispute resolution procedures
- Insurance/bonding requirements

**Consult legal counsel before operating in production.**

## 🔮 Future Improvements

- [ ] Multi-signature custodial wallet
- [ ] Automated fund release via backend API
- [ ] Support for multiple currencies (USDC, DAI, etc.)
- [ ] Escrow insurance/bonding
- [ ] Decentralized dispute resolution
- [ ] Integration with identity verification
- [ ] Compliance tools (KYC/AML)
- [ ] Migration to smart contracts for full trustlessness

## 🤝 Comparison: Custodial vs Smart Contract

| Feature | Custodial Escrow | Smart Contract Escrow |
|---------|------------------|----------------------|
| **Funds Custody** | SplitBase wallet | Smart contract |
| **Trust** | Trust SplitBase | Trustless code |
| **Flexibility** | High (manual overrides) | Limited (code is law) |
| **Disputes** | Manual resolution | On-chain arbitration |
| **Fees** | Lower (no gas for release) | Higher (gas fees) |
| **Speed** | Fast (off-chain logic) | Slower (on-chain txs) |
| **Complexity** | Simple to implement | Complex development |
| **Transparency** | Database + tx hashes | Fully on-chain |

## 📞 Support

For issues or questions about the custodial escrow system:

1. Check this documentation
2. Review activity logs in escrow details
3. Verify transaction on blockchain explorer
4. Open a GitHub issue for bugs
5. Contact support for disputes

---

**Built with trust, secured by blockchain verification.** 🔒

