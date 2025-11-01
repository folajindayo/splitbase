# Quick Start Guide - New Features

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Migrations

Open your Supabase SQL Editor and run these files **in order**:

1. `supabase-schema.sql` (if not already done)
2. `supabase-migration.sql`
3. `supabase-templates-migration.sql`
4. `supabase-email-migration.sql`

### Step 2: Configure Email (Optional)

If you want email notifications:

1. Sign up at [Resend](https://resend.com) (free)
2. Get your API key
3. Add to `app/.env.local`:
   ```
   RESEND_API_KEY=re_your_key_here
   RESEND_FROM_EMAIL="SplitBase <notifications@yourdomain.com>"
   ```

If you skip this step, email features will be disabled (no errors).

### Step 3: Test the Features

1. Start the dev server: `cd app && npm run dev`
2. Open http://localhost:3000
3. Connect your wallet

### Step 4: Try Each Feature

#### ✅ Templates
1. Click "Create New Split"
2. Click "Use Template" button
3. Select a preset template (e.g., "50/50 Split")
4. Addresses and percentages are auto-filled!
5. Save your own template by configuring recipients and clicking "Save Current as Template"

#### ✅ QR Codes
Already working! On any split page:
1. Click "Show QR" 
2. Scan with mobile wallet
3. Download QR code image

#### ✅ CSV Export
Already working! On dashboard:
1. Click "Export CSV" to download all splits
2. Or export individual split data from split details page

#### ✅ ENS/Basename
1. Click "Create New Split"
2. In recipient address field, type: `vitalik.eth`
3. See it resolve to the address automatically!
4. Or type `name.base.eth` for Basename

#### ✅ Email Notifications
1. Click "Create New Split"
2. Scroll down to "Email Notifications" section
3. Toggle on and enter your email
4. You'll get emails when payments are distributed!

## 🎯 Common Use Cases

### Use Case 1: Quick Team Split
1. Click "Use Template" → "Team Revenue (4)"
2. Replace placeholder addresses with your team's ENS names
3. Enable email notifications for the team lead
4. Deploy!

### Use Case 2: Share Split with QR Code
1. Go to your split page
2. Click "Show QR"
3. Click "Download QR"
4. Share the QR code image on social media, posters, etc.

### Use Case 3: Track Payments in Spreadsheet
1. Go to Dashboard
2. Click "Export CSV"
3. Open in Excel/Google Sheets
4. Analyze your split data

### Use Case 4: Create Reusable Template
1. Create a split with your standard percentages
2. In the Templates modal, click "Save Current as Template"
3. Name it (e.g., "My Standard Split")
4. Reuse it for future projects!

## 🔍 Troubleshooting

### ENS/Basename Not Resolving?
- Make sure your wallet is connected
- Check that you're on the correct network (Base Sepolia or Mainnet)
- Try refreshing the page

### Email Not Sending?
- Check your `RESEND_API_KEY` in `.env.local`
- In development, emails are logged to console instead
- Verify your email address format is valid

### Templates Not Loading?
- Run the `supabase-templates-migration.sql` file
- Check Supabase connection in console
- Refresh the page

### QR Code Not Working?
- Already implemented! Should work out of the box
- Make sure you're on the split details page

### CSV Export Empty?
- Create some splits first!
- Check browser console for errors

## 📚 Feature Details

### Templates
- **6 Preset Templates**: 50/50, Thirds, Team (4), Creator (80/20), DAO, Founders (3)
- **Custom Templates**: Save any configuration for reuse
- **Usage Tracking**: See which templates are most popular
- **Easy Management**: Delete custom templates you don't need

### QR Codes
- **EIP-681 Format**: Compatible with all Web3 wallets
- **Download**: Save QR as PNG image
- **Amount Support**: Include preset amounts in QR code
- **Mobile Friendly**: Optimized for scanning

### CSV Export
- **Single Split**: Detailed export with recipients
- **All Splits**: Overview of all your splits
- **Recipients**: Detailed recipient data across splits
- **Format**: Standard CSV format, opens in Excel/Sheets

### ENS/Basename
- **Forward Resolution**: name.eth → 0x address
- **Reverse Resolution**: 0x address → name.eth
- **Real-time**: Resolves as you type
- **Validation**: Visual feedback for valid/invalid names
- **Cache**: Fast lookups after first resolution

### Email Notifications
- **Distribution Alerts**: When payments are received
- **Transaction Details**: Amount, hash, explorer link
- **Split Creation**: Confirmation when split is deployed
- **Beautiful HTML**: Professional email templates
- **Optional**: Completely opt-in, disabled by default

## 🎉 You're All Set!

All features are now available in your SplitBase instance. 

**Need Help?**
- Check `IMPLEMENTATION_SUMMARY.md` for technical details
- Review the main `README.md` for complete documentation
- Check browser console for any errors

**Next Steps:**
- Create your first split with a template
- Generate a QR code and test scanning it
- Export your data to CSV
- Set up email notifications for important splits

Enjoy your enhanced SplitBase experience! 🚀

