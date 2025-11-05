# Environment Setup Guide

This document explains all environment variables required for SplitBase.

## Required Environment Variables

Create `app/.env.local` with the following variables:

### 1. Reown (WalletConnect) Configuration

```bash
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id_here
```

Get your Project ID from [Reown Cloud](https://cloud.reown.com/).

### 2. Smart Contract Addresses

```bash
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_SEPOLIA=your_deployed_factory_address
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_BASE=your_deployed_factory_address
```

Deploy the SplitFactory contract and add the addresses here.

### 3. Supabase Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your [Supabase project settings](https://supabase.com/).

### 4. Blockchain Configuration

```bash
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
```

- `NEXT_PUBLIC_DEFAULT_CHAIN_ID`: 84532 for Base Sepolia (testnet), 8453 for Base (mainnet)
- `NEXT_PUBLIC_RPC_URL`: RPC endpoint for blockchain interactions

## 🔒 Custodial Escrow System

### Custodial Wallet Address (Public)

```bash
NEXT_PUBLIC_CUSTODIAL_WALLET_ADDRESS=0x0000000000000000000000000000000000000000
```

This is the wallet address where escrow funds will be held. Users will send deposits to this address.

### Custodial Wallet Private Key (Secret)

```bash
CUSTODIAL_WALLET_PRIVATE_KEY=your_private_key_here
```

**⚠️ CRITICAL SECURITY WARNING:**
- **NEVER** commit this to git or expose it publicly
- This is used by the backend API to release funds
- Only used server-side, never exposed to client
- For production: Use a secure key management system (AWS KMS, HashiCorp Vault, etc.)
- For development: Generate a test wallet and fund with testnet ETH

### How to Generate a Custodial Wallet

#### Option 1: Using Node.js (for testing)

```javascript
const { ethers } = require('ethers');

// Generate a new wallet
const wallet = ethers.Wallet.createRandom();

console.log('Custodial Wallet Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('\n⚠️  Keep the private key secure!');
```

#### Option 2: Using MetaMask (for testing)

1. Create a new MetaMask account
2. Export the private key (Settings → Security & Privacy → Reveal Private Key)
3. Copy the address and private key

#### Option 3: For Production

Use a hardware wallet or multi-signature wallet:
- Gnosis Safe (multi-sig)
- Ledger or Trezor (hardware wallet)
- AWS KMS or HashiCorp Vault for key management

### Funding the Custodial Wallet

For testing on Base Sepolia:
1. Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. Send some ETH to your custodial wallet address
3. This ETH is used for gas fees when releasing funds

## 📧 Email Notifications (Optional)

```bash
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL="SplitBase <notifications@yourdomain.com>"
```

Get an API key from [Resend](https://resend.com/):
1. Sign up for a free account
2. Verify your sending domain
3. Generate an API key

## Complete `.env.local` Example

```bash
# Reown (WalletConnect)
NEXT_PUBLIC_REOWN_PROJECT_ID=abc123def456

# Smart Contracts
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_SEPOLIA=0x123...
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_BASE=0x456...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Blockchain
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# Custodial Escrow (REQUIRED)
NEXT_PUBLIC_CUSTODIAL_WALLET_ADDRESS=0xYourCustodialAddress
CUSTODIAL_WALLET_PRIVATE_KEY=0xYourPrivateKey

# Email Notifications (OPTIONAL)
RESEND_API_KEY=re_abc123
RESEND_FROM_EMAIL="SplitBase <notifications@yourdomain.com>"
```

## 🔐 Security Best Practices

### Development

1. **Use Testnet**: Always use testnet (Sepolia, Base Sepolia) for development
2. **Generate Test Wallet**: Create a new wallet just for testing
3. **Test ETH Only**: Fund with testnet ETH from faucets
4. **Never Reuse**: Don't use mainnet private keys in development
5. **Gitignore**: Keep `.env.local` in `.gitignore` at all times

### Production

1. **Key Management**:
   - Use AWS KMS, Google Cloud KMS, or HashiCorp Vault
   - Never store private keys in environment variables on servers
   - Implement key rotation policies

2. **Wallet Security**:
   - Consider multi-signature wallets (Gnosis Safe)
   - Use hardware wallets for signing
   - Implement withdrawal limits
   - Regular security audits

3. **Access Control**:
   - Restrict API access to fund release endpoints
   - Implement proper authentication
   - Log all release operations
   - Monitor for suspicious activity

4. **Monitoring**:
   - Monitor custodial wallet balance
   - Alert on unexpected transactions
   - Track all deposits and releases
   - Regular audit log reviews

5. **Compliance**:
   - Consider KYC/AML requirements
   - Check local regulations for custodial services
   - Implement transaction limits
   - Consider insurance/bonding

## 🛠️ Verification

To verify your environment is set up correctly:

1. **Check Wallet Configuration**:
```bash
cd app
npm run dev
```
Visit `http://localhost:3000` and try to:
- Connect your wallet
- Create a split
- Create an escrow

2. **Check Custodial Wallet Balance**:
```javascript
// In browser console on your app
const balance = await fetch('/api/escrow/balance');
const data = await balance.json();
console.log('Custodial balance:', data.balance, 'ETH');
```

3. **Test Escrow Flow**:
- Create a test escrow
- Fund it with testnet ETH
- Verify transaction on blockchain explorer
- Release funds
- Check seller received funds

## 📚 Additional Resources

- [Reown Documentation](https://docs.reown.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Base Documentation](https://docs.base.org/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Custodial Escrow Guide](./CUSTODIAL_ESCROW.md)

## ⚠️ Important Reminders

- **NEVER** commit `.env.local` to git
- **NEVER** expose private keys publicly
- **ALWAYS** use testnet for development
- **ALWAYS** use secure key management in production
- **REGULARLY** audit and monitor custodial wallet
- **CONSIDER** legal and regulatory requirements

---

**Need help?** Open an issue on GitHub or check the documentation.

