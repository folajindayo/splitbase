# Environment Setup Guide

This guide explains all environment variables required for SplitBase, including the new custodial escrow system.

## Required Environment Variables

Create a `.env.local` file in the `app` directory with the following variables:

### Supabase Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to get these:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings > API
4. Copy the URL and anon/public key

### WalletConnect (Reown) Configuration

```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
```

**Where to get this:**
1. Go to [Reown Cloud](https://cloud.reown.com/)
2. Create a new project
3. Copy the Project ID

### Email Configuration (Resend)

```bash
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_FROM_EMAIL=noreply@yourdomain.com
```

**Where to get this:**
1. Go to [Resend](https://resend.com/)
2. Sign up for an account
3. Create an API key
4. Set up a verified sender domain

### Escrow Custody System (CRITICAL)

```bash
ESCROW_ENCRYPTION_KEY=your-secure-32-char-encryption-key-here
```

**How to generate:**

#### Option 1: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Option 2: OpenSSL
```bash
openssl rand -hex 32
```

#### Option 3: Python
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**⚠️ IMPORTANT SECURITY NOTES:**
- **NEVER** commit this key to version control
- Use different keys for development, staging, and production
- Store production keys in secure secret management (AWS Secrets Manager, HashiCorp Vault, etc.)
- Back up this key securely - if lost, funds cannot be released
- Rotate keys periodically following best practices
- Minimum 32 characters (256 bits) required

### Base Network RPCs (Optional)

```bash
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
```

These are optional. The application uses public endpoints by default.

**For production:**
- Consider using Alchemy, Infura, or other RPC providers
- Rate limits on public endpoints may affect performance

### Contract Addresses (Auto-populated)

```bash
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_SEPOLIA=
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_MAINNET=
```

These are populated automatically after smart contract deployment.

## Complete .env.local Example

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0

# Resend Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FROM_EMAIL=noreply@splitbase.com

# Escrow Custody (CRITICAL - See security notes above)
ESCROW_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Base RPCs (Optional)
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org

# Contract Addresses (After deployment)
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_SEPOLIA=0x...
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_MAINNET=0x...
```

## Environment-Specific Configuration

### Development
- Use separate Supabase project for dev
- Use test WalletConnect project
- Use Resend test mode
- Generate separate encryption key
- Use Base Sepolia (testnet)

### Staging
- Separate encryption key from production
- Use staging Supabase project
- Test email with limited domain
- Monitor for issues

### Production
- **Store encryption key in secure vault**
- Use production Supabase with proper RLS
- Set up email domain authentication
- Use Base Mainnet
- Enable monitoring and alerts
- Implement key rotation policy

## Security Checklist

Before deploying to production:

- [ ] All secrets generated with cryptographically secure methods
- [ ] Encryption key backed up securely (offline, encrypted storage)
- [ ] Different keys for dev/staging/production
- [ ] Encryption key stored in secret manager (not .env file)
- [ ] All environment variables validated
- [ ] RPC endpoints have appropriate rate limits
- [ ] Email domain verified and authenticated
- [ ] Supabase RLS policies enabled and tested
- [ ] Monitoring and alerts configured
- [ ] Backup and disaster recovery plan documented
- [ ] Key rotation schedule established

## Verifying Setup

After setting up environment variables, verify:

### 1. Supabase Connection
```bash
# In your app
npm run dev
# Check browser console for Supabase connection
```

### 2. WalletConnect
- Try connecting wallet on frontend
- Should see WalletConnect modal

### 3. Resend Email
- Send a test email through the application
- Check Resend dashboard for delivery

### 4. Escrow Custody
- Create a test escrow
- Check that custody wallet address is generated
- Verify encryption key is set (no errors in console)

## Troubleshooting

### "Encryption key not set" error
- Ensure `ESCROW_ENCRYPTION_KEY` is in `.env.local`
- Restart the development server
- Check key is exactly 32 characters (64 hex digits)

### Supabase connection issues
- Verify URL and anon key are correct
- Check Supabase project is active
- Ensure RLS policies allow access

### WalletConnect not appearing
- Verify project ID is correct
- Check network connectivity
- Try clearing browser cache

### Email not sending
- Verify Resend API key
- Check sender domain is verified
- Look for errors in server logs

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Reown (WalletConnect) Docs](https://docs.walletconnect.network/)
- [Resend Documentation](https://resend.com/docs)
- [Base Network Documentation](https://docs.base.org/)
- [Custody System Details](./CUSTODY_SYSTEM.md)

## Support

For issues with environment setup:
1. Check this guide thoroughly
2. Review error messages in console
3. Verify all keys are correct
4. Restart development server
5. Clear browser cache and cookies

---

**Last Updated**: November 6, 2025

