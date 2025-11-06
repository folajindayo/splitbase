# 🔐 Custody System Documentation

## Overview

SplitBase now features a **custodial escrow system** where the platform acts as a trusted intermediary, holding funds securely until release conditions are met. This eliminates the need for smart contracts while providing secure, automated escrow services.

## How It Works

### 1. Wallet Generation
When an escrow is created, SplitBase automatically:
- Generates a unique Ethereum wallet for that specific escrow
- Encrypts and securely stores the private key in the database
- Provides the wallet address for deposits

### 2. Secure Key Storage
- Private keys are encrypted using AES-256-CBC encryption
- Encryption key is stored as an environment variable
- Keys are only decrypted when needed for fund release
- Each escrow has its own unique wallet

### 3. Automatic Funding Detection
- System polls the custody wallet balance every 10 seconds
- When balance reaches the expected amount, escrow is automatically marked as "funded"
- No manual confirmation needed from the buyer
- Transaction history is recorded automatically

### 4. Fund Release
- Only the buyer can release funds to the seller
- System decrypts the private key temporarily
- Sends a blockchain transaction from custody wallet to seller
- Automatically calculates and deducts gas fees
- Updates escrow status and logs activity

## Security Features

### Encryption
```typescript
- Algorithm: AES-256-CBC
- Key derivation: scrypt
- Unique IV per encryption
- Keys stored encrypted at rest
```

### Access Control
- Private keys never exposed to users
- Keys only decrypted server-side for releases
- Release requires buyer authentication
- All actions are logged and auditable

### Wallet Isolation
- Each escrow has a separate wallet
- Funds are isolated from other escrows
- No commingling of funds
- Clear audit trail per escrow

## User Experience

### For Buyers (Creators)
1. Create an escrow agreement
2. Receive a unique deposit address with QR code
3. Send funds from your wallet to the address
4. System automatically detects and confirms funding
5. Release funds when satisfied with seller's delivery

### For Sellers
1. Receive escrow notification
2. View deposit address and expected amount
3. Wait for buyer to fund
4. Deliver goods/services
5. Receive funds automatically when buyer releases

## API Endpoints

### Check Wallet Balance
```typescript
POST /api/escrow/check-balance
Body: {
  walletAddress: string;
  chainId: number;
}
Response: {
  balance: string;
  balanceInEth: string;
  address: string;
}
```

### Auto-Fund Check
```typescript
POST /api/escrow/auto-fund-check
Body: {
  escrowId: string;
  chainId: number;
}
Response: {
  funded: boolean;
  autoMarked?: boolean;
  balance: number;
  expectedAmount: number;
  txHash?: string;
}
```

### Release Funds
```typescript
POST /api/escrow/release-funds
Body: {
  escrowId: string;
  releasedBy: string;
  chainId: number;
}
Response: {
  success: boolean;
  txHash: string;
  amountSent: string;
  message: string;
}
```

## Components

### CustodyWalletDisplay
Main UI component for displaying custody wallet information:
- Shows QR code for easy deposits
- Displays wallet address with copy button
- Shows current vs expected balance
- Auto-refreshes balance
- Visual funding confirmation
- Safety warnings and instructions

### Features
- Real-time balance checking
- QR code generation
- Copy-to-clipboard functionality
- Visual status indicators
- Mobile-friendly design

## Database Schema

### Escrows Table (Updated)
```sql
ALTER TABLE escrows
ADD COLUMN encrypted_private_key TEXT,
ADD COLUMN custody_wallet_address TEXT;
```

## Environment Variables

### Required
```bash
# Encryption key for private keys (32 characters minimum)
ESCROW_ENCRYPTION_KEY=your-secure-32-char-encryption-key-here
```

⚠️ **CRITICAL**: Never commit this key to version control. Use different keys for development and production.

## Setup Instructions

### 1. Run Database Migration
```bash
# In Supabase SQL Editor
# Run: supabase-escrow-custody-migration.sql
```

### 2. Set Environment Variable
```bash
# Add to .env.local
ESCROW_ENCRYPTION_KEY=<generate-secure-32-char-key>
```

### 3. Generate Secure Key (Node.js)
```javascript
const crypto = require('crypto');
const key = crypto.randomBytes(32).toString('hex');
console.log(key); // Use this as your encryption key
```

## Trust Model

### Platform as Custodian
- SplitBase holds funds temporarily
- Acts as neutral third party
- Enforces escrow rules programmatically
- No smart contract complexity
- Lower gas fees for users

### Benefits Over Non-Custodial
1. **Simplified UX**: No complex smart contract interactions
2. **Lower Costs**: Single transaction instead of multiple
3. **Faster Settlements**: Immediate release without blockchain delays
4. **Better Support**: Platform can assist with disputes
5. **Gas Optimization**: Platform optimizes gas fees

### Trade-offs
- Users must trust the platform
- Platform has access to encrypted keys
- Regulatory compliance required
- Single point of failure (mitigated by encryption)

## Best Practices

### For Platform Operators
1. Store encryption key in secure secret management (AWS Secrets Manager, HashiCorp Vault)
2. Implement key rotation policies
3. Set up audit logging for all decryption events
4. Use separate keys for dev/staging/production
5. Implement multi-signature for large releases
6. Regular security audits
7. Insurance for custodial holdings

### For Developers
1. Never log decrypted private keys
2. Clear sensitive data from memory after use
3. Use secure random generation for wallets
4. Implement rate limiting on API endpoints
5. Monitor for unusual wallet activity
6. Set up alerts for large releases

## Compliance Considerations

### Regulatory
- May require Money Service Business (MSB) license
- KYC/AML requirements may apply
- Varies by jurisdiction
- Consult legal counsel

### Data Protection
- Private keys are sensitive personal data
- GDPR/CCPA compliance required
- Implement data retention policies
- Secure deletion of old keys

## Monitoring & Alerts

### Key Metrics to Track
- Total value in custody
- Number of active escrows
- Failed release attempts
- Balance discrepancies
- Unusual transaction patterns
- Gas price trends

### Recommended Alerts
- Large balance detected (>X ETH)
- Multiple release failures
- Encryption/decryption errors
- Unexpected wallet activity
- Low gas in custody wallets

## Disaster Recovery

### Key Recovery
- Backup encryption keys securely
- Test recovery procedures regularly
- Document key locations
- Plan for key compromise scenarios

### Wallet Recovery
- Regular database backups
- Encrypted backup of private keys
- Multiple geographic locations
- Test restore procedures

## Migration Path

### From Non-Custodial
1. Run custody migration SQL
2. Set encryption key
3. New escrows automatically use custody
4. Old escrows continue non-custodial
5. Gradually phase out old system

### Rollback Plan
1. Disable custody features
2. Complete existing custody escrows
3. Revert to previous system
4. Migrate funds if necessary

## FAQ

### Q: What happens if the encryption key is lost?
A: Funds cannot be released. This is why secure key backup is critical.

### Q: Can users see their custody wallet private key?
A: No. Private keys are never exposed to users for security.

### Q: What if the platform goes down?
A: Encrypted keys are in database. With proper backups, funds can be recovered.

### Q: How are gas fees handled?
A: Automatically calculated and deducted from custody wallet balance.

### Q: Can an escrow be funded from an exchange?
A: Not recommended. Use a personal wallet for better tracking.

### Q: What networks are supported?
A: Currently Base Sepolia (testnet) and Base Mainnet.

## Roadmap

### Future Enhancements
- [ ] Multi-signature releases for large amounts
- [ ] Insurance coverage for custodial holdings
- [ ] Support for ERC-20 tokens
- [ ] Batch releases for multiple escrows
- [ ] Hardware security module (HSM) integration
- [ ] Cold storage for large balances
- [ ] Automated compliance reporting
- [ ] Integration with custody partners

## Support

For security issues, contact: security@splitbase.com (update with actual contact)

For general support: support@splitbase.com (update with actual contact)

## License

This custody system is part of SplitBase and subject to the same license terms.

---

**Last Updated**: November 6, 2025
**Version**: 1.0.0

