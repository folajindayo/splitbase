# WalletConnect Integration Guide

This document explains how SplitBase integrates with [WalletConnect](https://docs.walletconnect.network/) for secure wallet connectivity.

## 🔌 Overview

SplitBase uses **WalletConnect** (via Reown AppKit) to enable users to connect their Web3 wallets securely. This provides:

- **Universal wallet support** - Works with 300+ wallets
- **Multi-platform** - Desktop, mobile, and web
- **Secure authentication** - Industry-standard protocols
- **Base network optimized** - Prioritizes Base-native wallets

## 📦 Implementation

### Current Setup

We use the following WalletConnect packages:

```json
{
  "@reown/appkit": "^1.8.12",
  "@reown/appkit-adapter-ethers": "^1.8.12",
  "ethers": "^6.15.0"
}
```

### Configuration

See `app/components/AppKitProvider.tsx` for the complete setup. Key features:

#### 1. **Network Configuration**
```typescript
networks: [baseSepolia, base]
defaultNetwork: baseSepolia
```

We support both Base Sepolia (testnet) and Base Mainnet.

#### 2. **Featured Wallets**
Per [WalletConnect best practices](https://docs.walletconnect.network/), we prioritize:

1. **Coinbase Wallet** - Base native, optimized for Base network
2. **MetaMask** - Most popular wallet globally
3. **Trust Wallet** - Mobile-first experience
4. **Rainbow** - Beautiful UX
5. **Uniswap Wallet** - DeFi-focused

#### 3. **Enhanced Features**
```typescript
features: {
  analytics: true,  // Track connection metrics
  socials: [],      // Pure crypto experience
  email: false,     // Wallet-only auth
  swaps: false,     // Focused UX
  onramp: false,    // Can enable later
}
```

#### 4. **Modern Standards**
```typescript
enableEIP6963: true  // Better wallet discovery
enableWalletConnect: true
enableInjected: true
enableCoinbase: true
```

## 🎨 Theming

Custom theme aligned with Base branding:

```typescript
themeMode: "light",
themeVariables: {
  "--w3m-accent": "#0052FF",  // Base blue
  "--w3m-border-radius-master": "8px",
  "--w3m-font-family": "...",
}
```

## 🔐 Security Best Practices

Following [WalletConnect security guidelines](https://docs.walletconnect.network/):

### 1. **Environment Variables**
```bash
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id
```

Never commit your Project ID to version control (use `.env.local`).

### 2. **Metadata Configuration**
Properly configured metadata helps users verify they're connecting to the right app:

```typescript
metadata: {
  name: "SplitBase",
  description: "Onchain split payment dashboard powered by Base",
  url: window.location.origin,
  icons: ["..."],
}
```

### 3. **Network Validation**
Always verify the user is on the correct network:

```typescript
const { caipNetwork } = useAppKitNetwork();
const chainId = caipNetwork?.id ? parseInt(caipNetwork.id.toString()) : DEFAULT_CHAIN_ID;
```

### 4. **Address Validation**
Verify signer matches connected wallet:

```typescript
const signerAddress = await signer.getAddress();
if (signerAddress.toLowerCase() !== address.toLowerCase()) {
  throw new Error("Wallet address mismatch");
}
```

## 🎯 Usage in Components

### Connect Button
```tsx
<appkit-button />
```

The WalletConnect button is automatically styled and handles all connection flows.

### Get Connected Account
```tsx
import { useAppKitAccount } from "@reown/appkit/react";

const { address, isConnected } = useAppKitAccount();
```

### Get Network Info
```tsx
import { useAppKitNetwork } from "@reown/appkit/react";

const { caipNetwork } = useAppKitNetwork();
```

### Get Provider for Transactions
```tsx
import { useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";

const { walletProvider } = useAppKitProvider("eip155");
const provider = new BrowserProvider(walletProvider);
const signer = await provider.getSigner();
```

## 🌐 Supported Wallets

### Featured (Always Shown First)
1. **Coinbase Wallet** - Best for Base users
2. **MetaMask** - Industry standard
3. **Trust Wallet** - Mobile users

### Also Supported
4. Rainbow
5. Uniswap Wallet
6. + 300 more wallets via WalletConnect protocol

## 📱 Mobile Support

WalletConnect automatically handles mobile connections:

- **Deep linking** - Opens native wallet apps
- **QR codes** - Scan with mobile wallets
- **Mobile browsers** - In-app browser support

## 🔄 Connection Flow

1. User clicks "Connect Wallet"
2. WalletConnect modal opens
3. User selects wallet
4. Wallet prompts for approval
5. Connection established
6. Network check performed
7. User can interact with dApp

## 🐛 Troubleshooting

### Connection Issues

**Problem**: Wallet won't connect
**Solution**:
- Check Project ID is valid
- Verify network configuration
- Try different wallet
- Check browser console for errors

**Problem**: Wrong network
**Solution**:
- Use `NetworkChecker` component (already implemented)
- Prompt user to switch networks
- Show clear error messages

**Problem**: Provider not available
**Solution**:
```typescript
if (!walletProvider) {
  setError("Please reconnect your wallet");
  return;
}
```

### Development Tips

1. **Test with Multiple Wallets**: Different wallets behave differently
2. **Test on Mobile**: Mobile UX is critical
3. **Monitor Console**: WalletConnect logs useful debugging info
4. **Use Testnets**: Always test on Base Sepolia first

## 📚 Resources

### Official Documentation
- [WalletConnect Docs](https://docs.walletconnect.network/) - Main documentation
- [App SDK Guide](https://docs.walletconnect.network/) - For dApp developers
- [Cloud Dashboard](https://cloud.reown.com) - Get your Project ID
- [Explorer](https://walletconnect.com/explorer) - Browse supported wallets

### Community
- [Discord](https://discord.com/invite/walletconnect) - Get help
- [Twitter](https://twitter.com/walletconnect) - Updates
- [GitHub](https://github.com/WalletConnect) - Source code

### SplitBase Specific
- `app/components/AppKitProvider.tsx` - Main configuration
- `app/components/Navigation.tsx` - Connect button usage
- `app/components/CreateSplitModal.tsx` - Transaction signing
- `app/components/NetworkChecker.tsx` - Network validation

## 🚀 Advanced Features

### One-Click Auth (Future)
WalletConnect supports [One-Click Auth](https://docs.walletconnect.network/) for instant authentication without multiple prompts.

### Link Mode (Future)
Direct communication between wallets and apps without QR codes.

### Verify API (Future)
Show verified app badges in wallet connection screens.

## 📊 Analytics

With `analytics: true`, you can track:
- Connection rates
- Wallet distribution
- Network usage
- Error rates

View analytics in your [WalletConnect Cloud Dashboard](https://cloud.reown.com).

## 🔧 Customization

### Change Theme
```typescript
themeMode: "dark" // or "light"
```

### Custom Colors
```typescript
themeVariables: {
  "--w3m-accent": "#YOUR_COLOR",
  "--w3m-border-radius-master": "12px",
}
```

### Wallet Selection
```typescript
featuredWalletIds: ['wallet_id_1', 'wallet_id_2']
```

Find wallet IDs in the [WalletConnect Explorer](https://walletconnect.com/explorer).

## ✅ Best Practices Checklist

- [x] Project ID stored in environment variables
- [x] Proper metadata configuration
- [x] Network validation implemented
- [x] Address verification in transactions
- [x] Error handling for connection issues
- [x] Mobile-responsive design
- [x] Multiple wallet support
- [x] Base network optimization
- [x] Clear user feedback
- [x] Security best practices

## 🎉 Summary

SplitBase implements WalletConnect following all recommended best practices:

1. **Secure** - Industry-standard protocols
2. **User-friendly** - Simple connection flow
3. **Flexible** - 300+ wallets supported
4. **Optimized** - Base network prioritized
5. **Modern** - Latest WalletConnect features

For questions or issues, refer to the [WalletConnect Documentation](https://docs.walletconnect.network/).

