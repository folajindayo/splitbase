# SplitBase Quick Reference

## 🚀 Quick Commands

### Contracts
```bash
cd contracts
npm test                    # Run all tests
npm run compile            # Compile contracts
npm run deploy:sepolia     # Deploy to Sepolia
npm run deploy:base        # Deploy to Mainnet
```

### Frontend
```bash
cd app
npm run dev                # Start dev server
npm run build              # Production build
npm run start              # Start production
```

## 📁 Key Files

### Smart Contracts
- `contracts/contracts/SplitFactory.sol` - Factory contract
- `contracts/contracts/SplitBase.sol` - Split logic
- `contracts/test/SplitBase.test.ts` - Tests
- `contracts/scripts/deploy.ts` - Deployment
- `contracts/hardhat.config.ts` - Config

### Frontend
- `app/app/page.tsx` - Landing page
- `app/app/dashboard/page.tsx` - User dashboard
- `app/app/splits/[address]/page.tsx` - Split details
- `app/components/CreateSplitModal.tsx` - Create split
- `app/lib/contracts.ts` - Blockchain interactions
- `app/lib/splits.ts` - Database operations

## 🔑 Environment Variables

### Contracts (.env)
```bash
PRIVATE_KEY=                    # Wallet private key (no 0x)
BASE_SEPOLIA_RPC_URL=          # RPC URL (default provided)
BASE_RPC_URL=                  # RPC URL (default provided)
BASESCAN_API_KEY=              # For verification
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_REOWN_PROJECT_ID=              # WalletConnect
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_SEPOLIA= # Factory address
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_BASE=    # Factory address
NEXT_PUBLIC_SUPABASE_URL=                  # Database URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=             # Database key
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532         # Default network
```

## 🌐 Networks

### Base Sepolia (Testnet)
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Base Mainnet
- Chain ID: 8453
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org

## 📝 Contract Functions

### SplitFactory
```solidity
createSplit(address[] recipients, uint256[] percentages) 
  → returns (address splitAddress)

getSplitsByOwner(address owner) 
  → returns (address[] memory)

isValidSplit(address splitAddress) 
  → returns (bool)
```

### SplitBase
```solidity
distribute() 
  → manually distribute funds

getSplitDetails() 
  → returns (address[] memory, uint256[] memory)

getRecipientsCount() 
  → returns (uint256)

receive() 
  → auto-distributes ETH
```

## 🗄️ Database Schema

### splits table
- id (UUID, PK)
- contract_address (TEXT, UNIQUE)
- owner_address (TEXT)
- factory_address (TEXT)
- created_at (TIMESTAMP)

### recipients table
- id (UUID, PK)
- split_id (UUID, FK)
- wallet_address (TEXT)
- percentage (INTEGER, 1-100)

## 🔗 Useful Links

- **Base Docs**: https://docs.base.org
- **Reown Docs**: https://docs.reown.com
- **Supabase**: https://supabase.com
- **Hardhat**: https://hardhat.org
- **Next.js**: https://nextjs.org
- **ethers.js**: https://docs.ethers.org

## 🐛 Common Issues & Solutions

### "Insufficient funds"
→ Get Sepolia ETH from faucet

### "Wrong network"
→ Switch to Base Sepolia (84532) in wallet

### "Module not found"
→ Run `npm install` in correct directory

### "Database error"
→ Check Supabase SQL was executed

### "Transaction failed"
→ Check gas, network, and contract address

## 💡 Tips

1. **Always test on Sepolia first**
2. **Save your factory address after deployment**
3. **Verify contracts on BaseScan**
4. **Keep environment files secure**
5. **Monitor gas prices**
6. **Use the QUICKSTART guide for fast setup**

## 📊 Gas Estimates

- Deploy Factory: ~$1-2
- Create Split: ~$0.10-0.50
- Distribute: ~$0.05-0.20
- Deposit: Standard transfer (~$0.01-0.05)

## 🎯 Testing Checklist

- [ ] Compile contracts
- [ ] Run all tests (15 should pass)
- [ ] Deploy to Sepolia
- [ ] Verify on BaseScan
- [ ] Setup Supabase
- [ ] Configure frontend
- [ ] Test wallet connection
- [ ] Create test split
- [ ] Send funds
- [ ] Verify distribution
- [ ] Check transaction history

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Environment variables set
- [ ] Supabase configured
- [ ] Reown project created
- [ ] Wallet funded

### Deployment
- [ ] Deploy factory to Sepolia
- [ ] Verify contract
- [ ] Test create split
- [ ] Test distribution
- [ ] Update frontend .env
- [ ] Test frontend locally
- [ ] Deploy to Vercel
- [ ] Test production

### Post-deployment
- [ ] Monitor for errors
- [ ] Check BaseScan
- [ ] Verify Supabase data
- [ ] Test all user flows
- [ ] Document factory address

## 📞 Need Help?

1. Check **README.md** for overview
2. Use **QUICKSTART.md** for fast setup
3. Read **DEPLOYMENT.md** for production
4. Review **IMPLEMENTATION_SUMMARY.md** for details
5. Check browser console (F12)
6. Verify environment variables
7. Run contract tests

## 🎓 Learning Resources

- Solidity: https://soliditylang.org
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS: https://tailwindcss.com
- TypeScript: https://typescriptlang.org
- Base: https://base.org

---

**Project**: SplitBase  
**Version**: 1.0.0 (MVP)  
**Status**: Ready for Deployment  
**License**: MIT

