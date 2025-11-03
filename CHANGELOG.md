# Changelog

All notable changes to SplitBase will be documented in this file.

## [Unreleased] - 2025-11-03

### Added
- 📋 Split Templates system with 6 preset templates
- 🏷️ ENS/Basename support for recipient addresses
- 📧 Email notifications for distributions
- 🔍 Search and filter functionality for splits
- 📈 Enhanced analytics with visual charts
- 📋 Recent activity log component
- 📱 QR code generation (documented existing feature)
- 📊 CSV export (documented existing feature)
- 🔗 Updated WalletConnect integration with latest best practices
- ✅ EIP-6963 support for better wallet discovery
- 📚 Comprehensive documentation (6 new docs)

### Changed
- Enhanced WalletConnect configuration with more wallet options
- Prioritized Coinbase Wallet (Base native)
- Enabled analytics in WalletConnect
- Updated all documentation links to docs.walletconnect.network
- Improved navigation with better responsive design

### Removed
- 🌙 Dark mode - Keeping light mode only for consistency

## Commit History

### [1ff37a9] - 2025-11-03
**refactor: Remove dark mode, keep light mode only**
- Removed theme.ts and ThemeToggle.tsx
- Removed dark mode toggle from Navigation
- Cleaned up all dark: CSS classes from components
- Simplified styling with single theme

### [d6264a3] - 2025-11-03
**feat: Add 9 major features**
- Split Templates with preset and custom options
- QR Code generation documentation
- CSV Export documentation
- ENS/Basename support implementation
- Email notifications system
- Dark mode (later removed)
- Search & Filter functionality
- Enhanced Analytics with charts
- Activity Log component
- WalletConnect integration updates

## Database Migrations

### Required Migrations
1. `supabase-schema.sql` - Base tables
2. `supabase-migration.sql` - Additional fields
3. `supabase-templates-migration.sql` - Templates support
4. `supabase-email-migration.sql` - Email notifications

## Documentation Added

1. `IMPLEMENTATION_SUMMARY.md` - Technical details
2. `QUICK_START.md` - 5-minute setup guide
3. `WALLETCONNECT_INTEGRATION.md` - Integration guide
4. `WALLETCONNECT_UPDATES.md` - Latest changes
5. `FEATURES_ADDED_TODAY.md` - Feature summary
6. `NEW_FEATURES_COMPLETE.md` - Completion report
7. `CHANGELOG.md` - This file

## Statistics

- **Total Features:** 8 (9 minus dark mode)
- **New Components:** 11
- **Lines of Code:** ~2,500+
- **Documentation Pages:** 7
- **Database Tables:** 4
- **Production Ready:** ✅

## Links

- Repository: https://github.com/folajindayo/splitbase
- WalletConnect Docs: https://docs.walletconnect.network/
- Base Docs: https://docs.base.org

