#!/bin/bash

# SplitBase Custody Setup Script
# This script helps set up the custody system environment

set -e  # Exit on error

echo "======================================"
echo "SplitBase Custody System Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ -f "app/.env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local already exists${NC}"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "Setting up environment variables..."
echo ""

# Create .env.local file
cat > app/.env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Reown (WalletConnect) Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_FROM_EMAIL=noreply@yourdomain.com

# Escrow Custody System (CRITICAL)
ESCROW_ENCRYPTION_KEY=GENERATE_SECURE_KEY_HERE

# Base Network RPCs (Optional)
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org

# Contract Addresses (Auto-populated by deployment)
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_SEPOLIA=
NEXT_PUBLIC_SPLIT_FACTORY_ADDRESS_MAINNET=
EOF

echo -e "${GREEN}✓ Created app/.env.local${NC}"
echo ""

# Generate encryption key
echo "Generating secure encryption key..."
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Update the encryption key in .env.local
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/ESCROW_ENCRYPTION_KEY=.*/ESCROW_ENCRYPTION_KEY=$ENCRYPTION_KEY/" app/.env.local
else
    # Linux
    sed -i "s/ESCROW_ENCRYPTION_KEY=.*/ESCROW_ENCRYPTION_KEY=$ENCRYPTION_KEY/" app/.env.local
fi

echo -e "${GREEN}✓ Generated and set encryption key${NC}"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "1. Update the following in app/.env.local:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"
echo "   - RESEND_API_KEY (if using email)"
echo "   - NEXT_PUBLIC_FROM_EMAIL (if using email)"
echo ""
echo "2. Run database migrations in Supabase SQL Editor:"
echo "   - supabase-migration.sql"
echo "   - supabase-escrow-migration.sql"
echo "   - supabase-escrow-custody-migration.sql"
echo "   - supabase-custody-audit-migration.sql"
echo "   - supabase-rate-limit-migration.sql"
echo "   - supabase-notifications-migration.sql"
echo ""
echo "3. Install dependencies:"
echo "   cd app && npm install"
echo ""
echo "4. Start development server:"
echo "   npm run dev"
echo ""

echo -e "${GREEN}======================================"
echo "Setup Complete!"
echo "======================================${NC}"
echo ""
echo "Your encryption key has been generated and saved."
echo -e "${RED}KEEP THIS KEY SECURE!${NC}"
echo "Without it, you cannot access custody wallet funds."
echo ""
echo "Next steps:"
echo "1. Edit app/.env.local with your actual values"
echo "2. Run database migrations"
echo "3. Start the application"
echo ""

