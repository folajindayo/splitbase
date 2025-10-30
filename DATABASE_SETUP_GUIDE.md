# 🗄️ SplitBase Database Setup Guide

## ⚠️ Important Note

**Table creation requires admin access** through the Supabase Dashboard. According to the [Supabase documentation](https://supabase.com/docs), creating tables, indexes, and policies requires elevated permissions that the `anon` key doesn't have.

The `anon` key is designed for client-side operations (SELECT, INSERT, UPDATE), not for database schema management (DDL operations).

---

## 🚀 Quick Setup (2 minutes)

### Step 1: Open Supabase SQL Editor

Go to your Supabase project:
```
👉 https://doocpqfxyyiecxfhzslj.supabase.co
```

### Step 2: Navigate to SQL Editor

- Look for **"SQL Editor"** in the left sidebar
- Click on it
- Click **"New Query"** button (usually in the top right)

### Step 3: Copy the SQL

Copy this COMPLETE SQL script (all of it):

```sql
-- SplitBase Supabase Database Schema
-- Creates tables, indexes, RLS policies for the SplitBase application

-- Create splits table
CREATE TABLE IF NOT EXISTS splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT NOT NULL UNIQUE,
  owner_address TEXT NOT NULL,
  factory_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipients table
CREATE TABLE IF NOT EXISTS recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_splits_owner ON splits(owner_address);
CREATE INDEX IF NOT EXISTS idx_splits_contract ON splits(contract_address);
CREATE INDEX IF NOT EXISTS idx_recipients_split ON recipients(split_id);

-- Enable Row Level Security (RLS)
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read and write access
CREATE POLICY "Allow public read access on splits" 
  ON splits FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert on splits" 
  ON splits FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public read access on recipients" 
  ON recipients FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert on recipients" 
  ON recipients FOR INSERT 
  WITH CHECK (true);

-- Note: For production, consider implementing proper authentication
-- and restricting these policies to authenticated users only
```

### Step 4: Run the SQL

- Paste the SQL into the query editor
- Click the **"Run"** button (or press Ctrl/Cmd + Enter)
- Wait for confirmation message

### Step 5: Verify Tables Created

1. Go to **"Table Editor"** in the left sidebar
2. You should see two new tables:
   - ✅ `splits`
   - ✅ `recipients`
3. Click on each table to verify the structure

---

## 🎯 What This Creates

### Tables

#### `splits` table
Stores information about each split contract:
- `id` - Unique identifier (UUID)
- `contract_address` - Blockchain contract address (unique)
- `owner_address` - Wallet address of creator
- `factory_address` - Factory contract that created this split
- `created_at` - Timestamp of creation

#### `recipients` table
Stores the recipients for each split:
- `id` - Unique identifier (UUID)
- `split_id` - Links to splits table
- `wallet_address` - Recipient wallet address
- `percentage` - Percentage of split (1-100)

### Indexes

Performance optimization for common queries:
- Index on `owner_address` for fast owner lookups
- Index on `contract_address` for fast contract lookups
- Index on `split_id` for fast recipient lookups

### Security (RLS Policies)

Row Level Security policies that:
- Allow anyone to read splits and recipients
- Allow anyone to create new splits and recipients
- **Note**: For production, you should add authentication

---

## ✅ Verification Checklist

After running the SQL:

- [ ] No errors in SQL Editor
- [ ] `splits` table visible in Table Editor
- [ ] `recipients` table visible in Table Editor
- [ ] Both tables show correct columns
- [ ] Policies are enabled (check in Authentication > Policies)

---

## 🚀 Next Step: Launch Your App!

Once tables are created:

```bash
cd /Users/mac/splitbase/app
npm run dev
```

Then open: **http://localhost:3000**

---

## 🆘 Troubleshooting

### "Permission denied" error
- Make sure you're logged into Supabase Dashboard
- Verify you have admin access to the project
- Try refreshing the page and running again

### "Relation already exists" error
- This is fine! It means tables already exist
- The SQL uses `IF NOT EXISTS` so it's safe to run multiple times

### "Policies already exist" error
- This means policies were created before
- You can ignore this or drop and recreate them

### Tables not showing up
1. Refresh the Table Editor page
2. Check the SQL Editor for any error messages
3. Make sure the SQL completed successfully

### Need to start over?
If you want to delete and recreate:

```sql
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS recipients CASCADE;
DROP TABLE IF EXISTS splits CASCADE;
-- Then run the creation SQL again
```

---

## 📚 Learn More

- **Supabase Tables**: https://supabase.com/docs/guides/database/tables
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security
- **SQL Editor**: https://supabase.com/docs/guides/database/sql-editor

---

## 🎉 You're Almost There!

This is the **FINAL STEP** before your SplitBase is fully operational!

After creating the tables:
1. ✅ Smart contracts deployed (Sepolia + Mainnet)
2. ✅ Frontend configured
3. ✅ Database tables created
4. ✅ Ready to split payments!

**Total progress: 20/20 (100%)** 🎊

