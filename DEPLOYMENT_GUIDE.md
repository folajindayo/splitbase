# 🚀 Deployment Guide - SplitBase Custody System

Complete guide for deploying the SplitBase custodial escrow system to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Deployment Options](#deployment-options)
6. [Post-Deployment](#post-deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] **Supabase account** and project created
- [ ] **Reown (WalletConnect) project ID** obtained
- [ ] **Domain name** registered and configured
- [ ] **SSL certificate** ready (or use automatic Let's Encrypt)
- [ ] **Email service** configured (Resend recommended)
- [ ] **Encryption key** generated and stored securely
- [ ] **Security checklist** completed (see SECURITY_CHECKLIST.md)
- [ ] **Database migrations** tested in staging
- [ ] **Code** reviewed and tested

---

## Pre-Deployment Checklist

### Security (CRITICAL)
- [ ] Encryption key generated with `openssl rand -hex 32`
- [ ] All keys stored in secret manager (not in code)
- [ ] Different keys for dev/staging/prod
- [ ] Row Level Security enabled on all tables
- [ ] Rate limiting configured
- [ ] API authentication enabled
- [ ] HTTPS only (no HTTP)
- [ ] Security headers configured

### Performance
- [ ] Redis configured for rate limiting
- [ ] CDN enabled for static assets
- [ ] Image optimization enabled
- [ ] Database indexes created
- [ ] Caching strategy implemented

### Monitoring
- [ ] Error tracking (Sentry) configured
- [ ] Logging service set up
- [ ] Health check endpoints working
- [ ] Alerting configured
- [ ] On-call rotation defined

---

## Environment Setup

### 1. Generate Encryption Key

```bash
# Generate a secure 64-character hex string
openssl rand -hex 32
```

**CRITICAL:** Store this in a secure secret manager (AWS Secrets Manager, HashiCorp Vault, etc.)

### 2. Required Environment Variables

Create these in your deployment platform:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxx

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Email (Optional)
RESEND_API_KEY=re_xxxxxxxxxxxx
NEXT_PUBLIC_FROM_EMAIL=noreply@yourdomain.com

# Custody System (CRITICAL)
ESCROW_ENCRYPTION_KEY=your_64_char_hex_string_here

# Network RPCs (Optional - use your own for better performance)
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
```

---

## Database Setup

### 1. Run Migrations in Order

Execute these SQL files in your Supabase SQL Editor **in this exact order**:

```sql
-- 1. Base tables
supabase-migration.sql

-- 2. Escrow system
supabase-escrow-migration.sql

-- 3. Custody wallets
supabase-escrow-custody-migration.sql

-- 4. Audit logging
supabase-custody-audit-migration.sql

-- 5. Rate limiting
supabase-rate-limit-migration.sql

-- 6. Notifications
supabase-notifications-migration.sql
```

### 2. Verify Migrations

```bash
# Run validation script
node scripts/validate-migrations.js
```

### 3. Enable Row Level Security

Ensure RLS is enabled on all tables:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Enable if not already enabled
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Configure Project

```bash
cd /path/to/splitbase/app
vercel
```

#### Step 3: Set Environment Variables

```bash
# Production environment
vercel env add ESCROW_ENCRYPTION_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... add all other required variables
```

#### Step 4: Deploy

```bash
# Deploy to production
vercel --prod
```

#### Post-Deployment

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Environment variables verified
- [ ] Health check passing

---

### Option 2: Docker + Cloud (AWS, GCP, Azure)

#### Step 1: Build Docker Image

```bash
docker build -t splitbase:latest \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --build-arg NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID \
  .
```

#### Step 2: Tag for Registry

```bash
# AWS ECR example
docker tag splitbase:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/splitbase:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/splitbase:latest
```

#### Step 3: Deploy to Container Service

**AWS ECS:**
```bash
aws ecs update-service \
  --cluster splitbase-cluster \
  --service splitbase-service \
  --force-new-deployment
```

**Google Cloud Run:**
```bash
gcloud run deploy splitbase \
  --image gcr.io/PROJECT_ID/splitbase:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Azure Container Instances:**
```bash
az container create \
  --resource-group splitbase-rg \
  --name splitbase \
  --image splitbase.azurecr.io/splitbase:latest \
  --dns-name-label splitbase \
  --ports 3000
```

---

### Option 3: Docker Compose (VPS)

#### Step 1: Copy Files to Server

```bash
scp -r . user@your-server.com:/opt/splitbase/
```

#### Step 2: Configure Environment

```bash
ssh user@your-server.com
cd /opt/splitbase
cp .env.example .env
# Edit .env with production values
nano .env
```

#### Step 3: Deploy

```bash
docker-compose up -d
```

#### Step 4: Configure Nginx (if not using built-in)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://yourdomain.com/api/escrow/health

# Expected response
{
  "status": "healthy",
  "checks": {
    "database": true,
    "encryption": true,
    "rpcConnection": true,
    "custodyWallets": true
  }
}
```

### 2. Test Critical Flows

- [ ] Create escrow
- [ ] Fund escrow (testnet)
- [ ] Release funds
- [ ] Refund funds
- [ ] Milestone payment
- [ ] Email notifications
- [ ] Webhook delivery

### 3. Enable Monitoring

**Sentry (Error Tracking):**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**DataDog (APM):**
```bash
npm install dd-trace
# Add to server initialization
```

### 4. Set Up Alerts

Configure alerts for:
- API error rate > 5%
- Response time > 2s
- Custody wallet balance changes
- Failed transactions
- Rate limit violations
- Health check failures

---

## Monitoring

### Key Metrics to Track

1. **System Health**
   - API uptime
   - Response times
   - Error rates
   - Database connection pool

2. **Custody Operations**
   - Total value in custody
   - Number of active escrows
   - Transaction success rate
   - Average escrow completion time

3. **Security**
   - Rate limit violations
   - Failed authentication attempts
   - Unusual wallet activity
   - Audit log anomalies

### Monitoring Tools

**Recommended Stack:**
- **Uptime:** UptimeRobot, Pingdom
- **APM:** DataDog, New Relic
- **Errors:** Sentry
- **Logs:** Logtail, Papertrail
- **Alerts:** PagerDuty, Opsgenie

---

## Troubleshooting

### Common Issues

#### 1. "Encryption key invalid"
**Cause:** Wrong or missing encryption key  
**Solution:** Verify `ESCROW_ENCRYPTION_KEY` is set and exactly 64 hex characters

#### 2. "Cannot connect to database"
**Cause:** Invalid Supabase credentials  
**Solution:** Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 3. "RPC connection failed"
**Cause:** Network RPC endpoint unreachable  
**Solution:** Verify `BASE_SEPOLIA_RPC` is accessible and not rate-limited

#### 4. "Health check failing"
**Cause:** Service not fully started  
**Solution:** Check logs, ensure all migrations ran, verify environment variables

#### 5. "Rate limit errors"
**Cause:** Too many requests from single source  
**Solution:** Configure Redis for production rate limiting

### Debug Commands

```bash
# View logs
docker-compose logs -f splitbase

# Check container status
docker-compose ps

# Restart service
docker-compose restart splitbase

# Run health check
curl https://yourdomain.com/api/escrow/health

# Test database connection
docker-compose exec splitbase node -e "require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).from('escrows').select('count').then(console.log)"
```

---

## Rollback Procedure

If deployment fails:

### 1. Vercel
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote [deployment-url]
```

### 2. Docker
```bash
# Roll back to previous image
docker-compose down
docker tag splitbase:previous splitbase:latest
docker-compose up -d
```

### 3. Database
```bash
# If migration fails, restore from backup
# See CUSTODY_BACKUP.md for backup procedures
```

---

## Production Checklist

Before announcing your launch:

- [ ] Security audit completed
- [ ] Load testing passed
- [ ] Monitoring configured
- [ ] Backup system working
- [ ] Disaster recovery plan documented
- [ ] Terms of service published
- [ ] Privacy policy published
- [ ] Support channels ready
- [ ] Documentation updated
- [ ] Team trained
- [ ] On-call rotation set
- [ ] Insurance obtained (if required)
- [ ] Legal review completed
- [ ] KYC/AML compliance (if required)
- [ ] Bug bounty program considered

---

## Support

For deployment support:
- Documentation: See all MD files in root directory
- Issues: GitHub Issues
- Email: support@yourdomain.com (update)

---

**Remember:** Take it slow, test thoroughly, and have a rollback plan ready.

**Status:** Production Ready 🚀  
**Last Updated:** November 6, 2025  
**Version:** 2.0.0

