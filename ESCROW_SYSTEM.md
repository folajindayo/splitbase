# Escrow System Documentation

## Overview

The SplitBase Escrow System is a comprehensive payment escrow solution that enables secure transactions between buyers and sellers without holding funds in custody. The system tracks escrow agreements, milestones, and releases in a database while funds are transferred directly between parties.

## Key Features

### 1. Three Escrow Types

**Simple Escrow**
- Basic two-party escrow
- Buyer creates → deposits → seller delivers → buyer releases
- Best for straightforward, one-time transactions

**Time-Locked Escrow**
- Includes a release deadline
- Optional auto-release after the deadline passes
- Protects both parties with time constraints
- Buyer can release before the deadline

**Milestone-Based Escrow**
- Payment released in stages
- Seller marks milestones as completed
- Buyer reviews and approves each milestone
- Perfect for long-term projects and phased deliveries

### 2. No Custody Model

Unlike traditional escrow services, SplitBase does not hold funds:
- Funds are sent directly to seller's address
- System tracks the escrow agreement and status
- Database manages the escrow logic
- No smart contracts required for escrow functionality

### 3. Complete Activity Logging

Every action is logged with:
- Action type (created, funded, milestone completed, released, etc.)
- Actor address (who performed the action)
- Timestamp
- Custom message
- Optional metadata (JSON)

### 4. Email Notifications

Optional email notifications for:
- Escrow created
- Funds deposited
- Milestone completed
- Funds released
- Time lock expiration

## Technical Architecture

### Database Schema

**escrows table:**
- Basic information (title, description, amounts)
- Buyer and seller addresses
- Escrow type and status
- Time lock configuration
- Deposit tracking (address, transaction hash)
- Timestamps (created, funded, released)

**escrow_milestones table:**
- Linked to parent escrow
- Title and description
- Amount (portion of total)
- Order index
- Status (pending, completed, released)
- Timestamps

**escrow_activities table:**
- Action log for all escrow events
- Actor tracking
- Message and metadata
- Timestamps

### File Structure

**Core Library:**
- `app/lib/escrow.ts` - Main escrow CRUD operations
- `app/lib/escrowTimeLock.ts` - Time lock utilities and countdown logic

**UI Components:**
- `app/components/CreateEscrowModal.tsx` - 4-step wizard for creating escrows
- `app/components/EscrowCard.tsx` - Escrow summary card
- `app/components/MilestoneProgress.tsx` - Milestone tracker with completion/release actions
- `app/components/TimeLockCountdown.tsx` - Live countdown timer for time-locked escrows

**Pages:**
- `app/app/escrow/page.tsx` - Main escrow dashboard with filters and search
- `app/app/escrow/[id]/page.tsx` - Detailed escrow view with actions and activity log

**Email Templates:**
- `app/lib/email.ts` - Extended with escrow email templates

**Database:**
- `supabase-escrow-migration.sql` - Database schema for escrow tables

## User Flows

### Buyer Flow (Simple Escrow)

1. **Create Escrow**
   - Navigate to Escrow page
   - Click "Create Escrow"
   - Enter title, description, seller address, amount
   - Choose "Simple Escrow" type
   - Review and create

2. **Fund Escrow**
   - Send funds to seller's address
   - Return to escrow page
   - Click "Mark as Funded"
   - Enter transaction hash

3. **Wait for Delivery**
   - Seller delivers goods/services
   - Review deliverables

4. **Release Payment**
   - Click "Release Funds"
   - Confirm the action
   - Funds are marked as released

### Seller Flow (Milestone Escrow)

1. **Receive Notification**
   - Buyer creates milestone escrow
   - Seller receives notification (if email enabled)

2. **Wait for Funding**
   - Buyer deposits funds
   - Seller receives funded notification

3. **Complete Milestones**
   - Deliver work for milestone 1
   - Click "Mark Complete" on milestone 1
   - Buyer receives notification to review

4. **Receive Payments**
   - Buyer approves and releases milestone 1 payment
   - Repeat for remaining milestones

### Time-Locked Escrow Flow

1. **Create with Deadline**
   - Buyer creates escrow with release date
   - Optional: Enable auto-release

2. **Fund and Wait**
   - Buyer funds escrow
   - Countdown timer shows time remaining

3. **Early or Automatic Release**
   - Buyer can release before deadline
   - If auto-release enabled, funds release automatically after deadline
   - If auto-release disabled, buyer must manually release after deadline

## API Functions

### Core Operations

```typescript
// Create a new escrow
createEscrow(data: CreateEscrowInput): Promise<string>

// Get user's escrows
getUserEscrows(address: string, role: 'buyer' | 'seller' | 'all'): Promise<EscrowWithMilestones[]>

// Get single escrow by ID
getEscrowById(id: string): Promise<EscrowWithMilestones | null>

// Update escrow status
updateEscrowStatus(id: string, status: string, actorAddress?: string, message?: string): Promise<void>

// Mark escrow as funded
markEscrowAsFunded(escrowId: string, transactionHash: string, actorAddress: string): Promise<void>

// Release escrow funds
releaseEscrow(escrowId: string, releasedBy: string): Promise<void>

// Complete a milestone
completeMilestone(milestoneId: string, actorAddress: string): Promise<void>

// Release milestone payment
releaseMilestone(milestoneId: string, releasedBy: string): Promise<void>

// Cancel escrow
cancelEscrow(escrowId: string, actorAddress: string): Promise<void>

// Get escrow statistics
getEscrowStats(address: string): Promise<EscrowStats>
```

### Time Lock Functions

```typescript
// Check if escrow can be auto-released
canAutoRelease(escrow: Escrow): boolean

// Check if time lock has expired
isTimeLockExpired(releaseDate: string): boolean

// Get formatted remaining time
getRemainingTime(releaseDate: string): string

// Get detailed time breakdown
getRemainingTimeBreakdown(releaseDate: string): TimeBreakdown
```

## Status Flow

**Escrow Status:**
- `pending` → Initial state after creation
- `funded` → After buyer deposits funds
- `released` → After all funds are released
- `disputed` → If there's a disagreement (future feature)
- `cancelled` → If escrow is cancelled before completion
- `expired` → If time lock expires without release (future feature)

**Milestone Status:**
- `pending` → Initial state
- `completed` → After seller marks as done
- `released` → After buyer approves and releases payment

## Security Considerations

1. **No Fund Custody**
   - SplitBase never holds user funds
   - Reduces regulatory and security burden
   - Lower risk for users

2. **Database-Only Logic**
   - No smart contract vulnerabilities
   - Easier to update and maintain
   - Lower transaction costs (no gas fees for escrow operations)

3. **Transparent Activity Log**
   - All actions are recorded
   - Immutable audit trail
   - Dispute resolution support

4. **Address Verification**
   - All addresses are normalized (lowercased)
   - ENS/Basename resolution supported
   - Validation at input

## Future Enhancements

1. **Dispute Resolution**
   - Add arbitrator role
   - Dispute submission and resolution flow
   - Evidence upload

2. **Multi-Currency Support**
   - Support for ERC-20 tokens
   - Multiple currency tracking
   - Exchange rate integration

3. **Reputation System**
   - Track successful completions
   - User ratings
   - Trust scores

4. **Advanced Time Locks**
   - Recurring escrows
   - Partial time-based releases
   - Conditional releases

5. **Integration with Payment Providers**
   - Coinbase Commerce
   - Stripe
   - Other payment gateways

## Best Practices

**For Buyers:**
- Clearly define deliverables in the description
- Use milestone escrows for large projects
- Set realistic time locks
- Communicate with sellers before creating escrow

**For Sellers:**
- Verify escrow details before accepting
- Keep evidence of deliverables
- Mark milestones promptly
- Maintain communication with buyers

**For Both Parties:**
- Agree to use SplitBase before starting
- Keep transaction hashes
- Monitor escrow status regularly
- Use email notifications for important updates

## Limitations

1. **No Custody**: System does not hold funds - relies on trust and tracking
2. **No Enforcement**: Cannot force payment release or returns
3. **Manual Deposits**: Buyers must manually send funds (not automated)
4. **Off-Chain**: Escrow logic is off-chain (database), not on blockchain
5. **Trust Required**: Both parties must agree to use the system

## Conclusion

The SplitBase Escrow System provides a lightweight, flexible escrow solution without the complexity of smart contracts or fund custody. It's ideal for users who want escrow tracking and management without the overhead of traditional escrow services.

