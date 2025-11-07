# 📖 SplitBase User Guide

**Welcome to SplitBase!** This guide will help you get started with our custodial escrow platform.

---

## Table of Contents

1. [What is SplitBase?](#what-is-splitbase)
2. [Getting Started](#getting-started)
3. [Creating Your First Escrow](#creating-your-first-escrow)
4. [Funding an Escrow](#funding-an-escrow)
5. [Managing Escrows](#managing-escrows)
6. [Releasing Funds](#releasing-funds)
7. [Milestones](#milestones)
8. [Best Practices](#best-practices)
9. [FAQs](#faqs)
10. [Support](#support)

---

## What is SplitBase?

SplitBase is a secure custodial escrow platform that protects both buyers and sellers in digital transactions. We hold funds securely until both parties fulfill their obligations.

### Key Benefits

✅ **Secure** - Your funds are protected by enterprise-grade encryption  
✅ **Simple** - No complicated smart contracts or blockchain knowledge needed  
✅ **Fast** - Automatic fund detection and instant releases  
✅ **Transparent** - Track your escrow status in real-time  
✅ **Trusted** - Complete audit trail of all operations  

---

## Getting Started

### 1. Connect Your Wallet

1. Visit [splitbase.app](https://splitbase.app)
2. Click "Connect Wallet" in the top right
3. Choose your wallet (MetaMask, WalletConnect, etc.)
4. Approve the connection

💡 **Tip:** Make sure you're on Base Sepolia for testing or Base Mainnet for real transactions.

### 2. Understand the Dashboard

Your dashboard shows:
- **Active Escrows** - Ongoing transactions
- **Pending** - Awaiting funding
- **Completed** - Successfully released
- **Total Value** - Amount in your escrows

---

## Creating Your First Escrow

### Step 1: Click "Create Escrow"

Navigate to your dashboard and click the "Create New Escrow" button.

### Step 2: Enter Basic Information

- **Title**: Give your escrow a descriptive name
- **Description**: Explain what the escrow is for
- **Buyer Address**: The address funding the escrow (usually you)
- **Seller Address**: The address receiving the funds
- **Amount**: How much ETH to escrow

### Step 3: Choose Escrow Type

#### Simple Escrow
- Best for one-time payments
- Buyer releases funds when satisfied
- Fastest and simplest option

#### Time-Locked Escrow
- Funds release automatically after a deadline
- Good for time-sensitive agreements
- Buyer can release early

#### Milestone Escrow
- Break payment into multiple milestones
- Release funds as work is completed
- Best for project-based work

### Step 4: Configure Details

**For Time-Locked Escrows:**
- Set release date
- Choose auto-release option

**For Milestone Escrows:**
- Add milestone titles
- Set amount for each milestone
- Describe completion criteria

### Step 5: Review and Create

- Double-check all details
- Click "Create Escrow"
- Confirm the transaction

✅ Your escrow is created! You'll receive a unique escrow ID.

---

## Funding an Escrow

### Automatic Detection

Once created, your escrow needs funding:

1. **Copy the Custody Wallet Address**
   - Find it in your escrow details
   - Or scan the QR code

2. **Send ETH to the Address**
   - Use your regular wallet
   - Send the exact amount specified
   - Our system detects deposits every 10 seconds

3. **Wait for Confirmation**
   - Status changes from "Pending" to "Funded"
   - You'll see a notification
   - Typically takes 1-2 minutes

💡 **Important:** 
- Send the EXACT amount specified
- Don't send from an exchange (they may not support custody wallets)
- Use Base Sepolia for testing, Base Mainnet for real transactions

---

## Managing Escrows

### View Escrow Details

Click any escrow to see:
- Current status
- Transaction history
- Custody wallet balance
- Milestone progress (if applicable)
- Activity log

### Escrow Statuses

| Status | Meaning |
|--------|---------|
| 🟡 **Pending** | Awaiting funding |
| 🟢 **Funded** | Money in custody, awaiting release |
| 🔵 **Released** | Funds sent to seller |
| 🔴 **Cancelled** | Escrow cancelled, funds refunded |
| ⚠️ **Disputed** | Under review |

### Actions You Can Take

**As Buyer:**
- Fund the escrow
- Release funds to seller
- Cancel (if not funded)
- Request refund (if funded)
- Open a dispute

**As Seller:**
- View escrow status
- Track funding
- Wait for release
- Submit milestone proof

---

## Releasing Funds

### When to Release

Release funds when:
- ✅ Service/product delivered as promised
- ✅ Quality meets expectations
- ✅ All agreed terms are fulfilled
- ✅ Communication with seller was good

### How to Release

1. Open the escrow details
2. Click "Release Funds"
3. Confirm you're satisfied
4. Approve the action
5. Funds are sent to seller immediately

⏱️ **Processing Time:** Usually 1-3 minutes depending on network

### Gas Fees

- Platform covers gas fees
- Automatically deducted from escrow amount
- Typically 0.0001-0.001 ETH

---

## Milestones

### How Milestones Work

1. **Create** - Define milestones when creating escrow
2. **Fund** - Deposit total amount
3. **Complete** - Seller completes milestone
4. **Release** - Buyer releases that milestone's payment
5. **Repeat** - Continue until all milestones complete

### Best Practices

✅ **Be Specific** - Clearly define each milestone  
✅ **Set Reasonable Amounts** - Match payment to work completed  
✅ **Communicate** - Discuss progress before releasing  
✅ **Review Work** - Verify completion before releasing  

### Example Milestone Structure

**Web Design Project - 1.0 ETH**

1. **Wireframes & Design** - 0.3 ETH
2. **Homepage Development** - 0.3 ETH
3. **Inner Pages** - 0.3 ETH
4. **Testing & Launch** - 0.1 ETH

---

## Best Practices

### For Buyers

✅ **Verify Seller** - Check reputation and past work  
✅ **Clear Agreements** - Document all expectations  
✅ **Use Milestones** - For large projects  
✅ **Communicate** - Stay in touch throughout  
✅ **Release Promptly** - When satisfied with work  

### For Sellers

✅ **Set Expectations** - Be clear about deliverables  
✅ **Regular Updates** - Keep buyer informed  
✅ **Quality Work** - Deliver as promised  
✅ **Documentation** - Provide proof of completion  
✅ **Professional Communication** - Stay respectful  

### Security Tips

🔒 **Never share** your private keys  
🔒 **Double-check** wallet addresses  
🔒 **Use test** network first (Base Sepolia)  
🔒 **Enable** two-factor authentication  
🔒 **Bookmark** the official website  
🔒 **Beware** of phishing attempts  

---

## FAQs

### General

**Q: How long does it take to create an escrow?**  
A: Less than 2 minutes! The system is instant once you submit.

**Q: What fees do you charge?**  
A: Currently in beta, all features are free. Future pricing TBD.

**Q: What happens if there's a dispute?**  
A: You can open a dispute, and our team will review the case.

**Q: Can I cancel an escrow?**  
A: Yes, if not yet funded. If funded, you can request a refund.

### Technical

**Q: Which networks do you support?**  
A: Base Sepolia (testnet) and Base Mainnet.

**Q: What tokens can I use?**  
A: Currently ETH only. More tokens coming soon!

**Q: Is my money safe?**  
A: Yes! Funds are held in unique custody wallets with encrypted keys.

**Q: What if I send the wrong amount?**  
A: Contact support immediately. We may be able to help.

### Timing

**Q: How long does funding detection take?**  
A: Automatic detection every 10 seconds. Usually 1-2 minutes.

**Q: How fast are releases?**  
A: 1-3 minutes depending on network congestion.

**Q: Can I speed up transactions?**  
A: No, our system optimizes gas automatically.

---

## Support

### Need Help?

📧 **Email:** support@splitbase.com  
💬 **Discord:** [Join our community](#)  
📚 **Docs:** [Documentation](#)  
🐛 **Bug Reports:** [GitHub Issues](#)  

### Office Hours

Monday-Friday: 9AM-6PM PST  
Saturday: 10AM-4PM PST  
Sunday: Closed  

**Response Time:** Usually within 24 hours

---

## Quick Reference

### Escrow Creation Checklist

- [ ] Connect wallet
- [ ] Enter escrow details
- [ ] Choose escrow type
- [ ] Set amount and addresses
- [ ] Review all information
- [ ] Create escrow
- [ ] Fund custody wallet
- [ ] Wait for confirmation

### Release Checklist

- [ ] Verify work is complete
- [ ] Check quality meets standards
- [ ] Communicate with seller
- [ ] Open escrow details
- [ ] Click "Release Funds"
- [ ] Confirm the action
- [ ] Wait for transaction

---

## Video Tutorials

🎥 **Coming Soon!**

- Creating your first escrow
- Setting up milestones
- Releasing funds safely
- Handling disputes
- Best practices guide

---

## Glossary

**Custody Wallet** - Unique wallet holding your escrow funds  
**Escrow** - Funds held by a third party until conditions are met  
**Milestone** - Stage of work in a multi-part project  
**Gas Fee** - Transaction cost on the blockchain  
**Release** - Send funds from escrow to seller  
**Refund** - Return funds from escrow to buyer  

---

**Welcome to safer transactions! 🎉**

Have questions? Don't hesitate to reach out to our support team.

---

*Last Updated: November 2025*  
*Version: 2.0*

