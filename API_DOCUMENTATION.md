# 📡 SplitBase Custody API Documentation

## Overview

Complete API documentation for the SplitBase Custodial Escrow System.

**Base URL:** `https://your-domain.com/api`  
**Version:** 2.0.0  
**Authentication:** Wallet-based authentication via Reown AppKit

---

## Table of Contents

1. [Check Balance](#1-check-balance)
2. [Auto-Fund Detection](#2-auto-fund-detection)
3. [Release Funds](#3-release-funds)
4. [Refund Funds](#4-refund-funds)
5. [Release Milestone](#5-release-milestone)
6. [Transaction History](#6-transaction-history)
7. [Custody Statistics](#7-custody-statistics)
8. [Health Check](#8-health-check)
9. [Rate Limits](#rate-limits)
10. [Error Codes](#error-codes)

---

## Authentication

All API endpoints require a valid wallet address. Some endpoints verify ownership through wallet signatures.

**Headers:**
```
Content-Type: application/json
```

---

## 1. Check Balance

Check the balance of a custody wallet.

**Endpoint:** `POST /api/escrow/check-balance`

**Rate Limit:** 60 requests per minute

**Request Body:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chainId": 84532
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletAddress` | string | Yes | Ethereum wallet address |
| `chainId` | number | Yes | Chain ID (84532 for Base Sepolia, 8453 for Base Mainnet) |

**Response:**
```json
{
  "balance": "1000000000000000000",
  "balanceInEth": "1.000000",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `balance` | string | Balance in wei |
| `balanceInEth` | string | Balance in ETH |
| `address` | string | Wallet address checked |

**Error Responses:**
- `400` - Invalid wallet address
- `429` - Rate limit exceeded
- `500` - Server error

---

## 2. Auto-Fund Detection

Automatically detect if an escrow has been funded.

**Endpoint:** `POST /api/escrow/auto-fund-check`

**Rate Limit:** 30 requests per minute

**Request Body:**
```json
{
  "escrowId": "123e4567-e89b-12d3-a456-426614174000",
  "chainId": 84532
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `escrowId` | string (UUID) | Yes | Escrow identifier |
| `chainId` | number | Yes | Chain ID |

**Response:**
```json
{
  "funded": true,
  "autoMarked": true,
  "balance": 1.5,
  "expectedAmount": 1.0,
  "txHash": "0xabc123..."
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `funded` | boolean | Whether escrow is funded |
| `autoMarked` | boolean | If auto-marked as funded |
| `balance` | number | Current balance in ETH |
| `expectedAmount` | number | Expected amount |
| `txHash` | string | Transaction hash (if detected) |

---

## 3. Release Funds

Release funds from custody to seller.

**Endpoint:** `POST /api/escrow/release-funds`

**Rate Limit:** 5 requests per 5 minutes

**Request Body:**
```json
{
  "escrowId": "123e4567-e89b-12d3-a456-426614174000",
  "releasedBy": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chainId": 84532
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `escrowId` | string (UUID) | Yes | Escrow identifier |
| `releasedBy` | string | Yes | Buyer's wallet address |
| `chainId` | number | Yes | Chain ID |

**Response:**
```json
{
  "success": true,
  "txHash": "0xdef456...",
  "amountSent": "950000000000000000",
  "message": "Funds successfully released to seller"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation success |
| `txHash` | string | Blockchain transaction hash |
| `amountSent` | string | Amount sent in wei |
| `message` | string | Status message |

**Error Responses:**
- `400` - Invalid parameters or escrow not funded
- `403` - Unauthorized (not buyer)
- `429` - Rate limit exceeded
- `500` - Release failed

---

## 4. Refund Funds

Refund funds from custody back to buyer.

**Endpoint:** `POST /api/escrow/refund-funds`

**Rate Limit:** 5 requests per 5 minutes

**Request Body:**
```json
{
  "escrowId": "123e4567-e89b-12d3-a456-426614174000",
  "cancelledBy": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chainId": 84532
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `escrowId` | string (UUID) | Yes | Escrow identifier |
| `cancelledBy` | string | Yes | Buyer's wallet address |
| `chainId` | number | Yes | Chain ID |

**Response:**
```json
{
  "success": true,
  "txHash": "0xghi789...",
  "amountRefunded": "950000000000000000",
  "message": "Funds successfully refunded to buyer"
}
```

---

## 5. Release Milestone

Release funds for a specific milestone.

**Endpoint:** `POST /api/escrow/release-milestone`

**Rate Limit:** 10 requests per 5 minutes

**Request Body:**
```json
{
  "escrowId": "123e4567-e89b-12d3-a456-426614174000",
  "milestoneId": "789e4567-e89b-12d3-a456-426614174000",
  "releasedBy": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chainId": 84532
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0xjkl012...",
  "amountSent": "250000000000000000",
  "milestoneTitle": "Phase 1 Completion",
  "allMilestonesReleased": false,
  "message": "Milestone successfully released to seller"
}
```

---

## 6. Transaction History

Get transaction history for a custody wallet.

**Endpoint:** `POST /api/escrow/custody-transactions`

**Rate Limit:** 30 requests per minute

**Request Body:**
```json
{
  "custodyAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chainId": 84532,
  "limit": 10
}
```

**Response:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "balance": "1.500000",
  "currency": "ETH",
  "transactions": [
    {
      "type": "funded",
      "date": "2025-11-06T10:30:00Z",
      "actor": "0xabc...",
      "message": "Escrow funded",
      "metadata": { "txHash": "0x..." }
    }
  ],
  "blockRange": {
    "from": 1000000,
    "to": 1010000
  }
}
```

---

## 7. Custody Statistics

Get platform-wide custody statistics.

**Endpoint:** `GET /api/escrow/custody-stats`

**Rate Limit:** 30 requests per minute

**Response:**
```json
{
  "totalEscrows": 150,
  "totalValueInCustody": "125.450000",
  "currency": "ETH",
  "byStatus": {
    "pending": 20,
    "funded": 80,
    "released": 40,
    "cancelled": 10
  },
  "metrics": {
    "fundedEscrows": 80,
    "releasedEscrows": 40,
    "completionRate": "50.00%",
    "averageEscrowValue": "0.8363",
    "recentEscrows": 15
  },
  "auditStats": {
    "totalOperations": 450,
    "walletCreations": 150,
    "fundsReleased": 40,
    "fundsRefunded": 10
  }
}
```

---

## 8. Health Check

Check system health status.

**Endpoint:** `GET /api/escrow/health`

**Rate Limit:** 60 requests per minute

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "encryption": true,
    "rpcConnection": true,
    "custodyWallets": true
  },
  "details": {
    "totalWallets": 150,
    "walletsWithBalance": 80,
    "totalValueInCustody": "125.450000",
    "issues": [],
    "timestamp": "2025-11-06T10:30:00Z"
  }
}
```

**Status Values:**
- `healthy` - All systems operational (HTTP 200)
- `warning` - Some issues detected (HTTP 200)
- `critical` - System issues (HTTP 503)

**Download Report:**
`POST /api/escrow/health` - Returns text file

---

## Rate Limits

Rate limits are enforced per IP address and per endpoint.

| Endpoint | Limit |
|----------|-------|
| `check-balance` | 60/minute |
| `auto-fund-check` | 30/minute |
| `release-funds` | 5/5 minutes |
| `refund-funds` | 5/5 minutes |
| `release-milestone` | 10/5 minutes |
| `custody-transactions` | 30/minute |
| `custody-stats` | 30/minute |
| `health` | 60/minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2025-11-06T10:31:00Z
```

**Rate Limit Exceeded Response:**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 30
}
```
HTTP Status: `429 Too Many Requests`

---

## Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - Authentication required |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |
| `503` | Service Unavailable - System health critical |

**Error Response Format:**
```json
{
  "error": "Error message",
  "details": "Additional information (optional)"
}
```

---

## Best Practices

### 1. Error Handling
Always check response status codes and handle errors appropriately.

```javascript
try {
  const response = await fetch('/api/escrow/release-funds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ escrowId, releasedBy, chainId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const data = await response.json();
  // Handle success
} catch (error) {
  // Handle error
}
```

### 2. Rate Limiting
Implement exponential backoff for rate limit errors.

### 3. Polling
For auto-fund-check, use reasonable intervals (10-15 seconds) to avoid rate limits.

### 4. Security
- Never expose private keys
- Validate all user inputs
- Use HTTPS only
- Implement CSRF protection

---

## Support

For API support:
- Documentation: See `/docs` folder
- Issues: GitHub Issues
- Email: support@splitbase.com (update with actual)

---

**Version:** 2.0.0  
**Last Updated:** November 6, 2025  
**Status:** Production Ready

