# 🔒 Security Checklist - SplitBase Custody System

## Critical: Must Complete Before Production

This checklist ensures your custodial escrow system is secure before going live.

---

## 🔴 **CRITICAL** (Must Complete)

### 1. Encryption Key Management
- [ ] **Generate unique encryption key** (64-character hex)
- [ ] **Store key in secure secret manager** (AWS Secrets Manager, HashiCorp Vault, Google Secret Manager)
- [ ] **Remove key from .env.local** after moving to secret manager
- [ ] **Never commit keys to Git**
- [ ] **Set up key rotation schedule** (every 90 days recommended)
- [ ] **Document key recovery process**
- [ ] **Create encrypted backup of old keys**

**Action:** 
```bash
# Generate secure key
openssl rand -hex 32

# Store in AWS Secrets Manager (example)
aws secretsmanager create-secret \
  --name splitbase/escrow-encryption-key \
  --secret-string "YOUR_GENERATED_KEY"
```

### 2. Database Security
- [ ] **Enable Row Level Security (RLS)** on all tables
- [ ] **Verify RLS policies** are correctly configured
- [ ] **Use service role key** server-side only
- [ ] **Never expose service role key** to client
- [ ] **Enable database backups** (daily minimum)
- [ ] **Test backup restoration process**
- [ ] **Set up database audit logging**
- [ ] **Enable SSL/TLS for database connections**

### 3. API Security
- [ ] **Implement authentication** on all endpoints
- [ ] **Verify wallet ownership** before operations
- [ ] **Enable rate limiting** (already implemented)
- [ ] **Move to Redis** for production rate limiting
- [ ] **Add CSRF protection**
- [ ] **Implement request signing**
- [ ] **Set up API monitoring**
- [ ] **Log all critical operations**

### 4. Private Key Storage
- [ ] **Verify AES-256-CBC encryption** is working
- [ ] **Test decryption process** in isolated environment
- [ ] **Never log decrypted keys**
- [ ] **Keys only decrypted in memory**
- [ ] **Implement key access audit trail** (already done)
- [ ] **Set up alerts for key access**
- [ ] **Regular security audits of key usage**

### 5. Environment Variables
- [ ] **All secrets in environment variables**
- [ ] **Never commit .env.local to Git** (already in .gitignore)
- [ ] **Use different keys for dev/staging/prod**
- [ ] **Rotate all keys after team member departure**
- [ ] **Implement secret scanning in CI/CD**
- [ ] **Document all required variables**

---

## 🟡 **HIGH PRIORITY** (Strongly Recommended)

### 6. Third-Party Security Audit
- [ ] **Hire security firm** to audit smart contracts (if any)
- [ ] **Code review** by external security experts
- [ ] **Penetration testing** of custody system
- [ ] **Review audit findings**
- [ ] **Implement recommended fixes**
- [ ] **Get security certification**

### 7. Infrastructure Security
- [ ] **Enable WAF** (Web Application Firewall)
- [ ] **Set up DDoS protection** (Cloudflare, AWS Shield)
- [ ] **Use CDN** for static assets
- [ ] **Enable HTTPS only** (no HTTP)
- [ ] **Configure security headers** (HSTS, CSP, etc.)
- [ ] **Implement IP whitelisting** for admin
- [ ] **Set up VPN** for administrative access

### 8. Monitoring & Alerting
- [ ] **Set up 24/7 monitoring** (DataDog, New Relic, Sentry)
- [ ] **Alert on custody wallet balance changes**
- [ ] **Alert on failed release attempts**
- [ ] **Monitor API error rates**
- [ ] **Track suspicious patterns**
- [ ] **Set up PagerDuty** or similar for critical alerts
- [ ] **Define on-call rotation**

### 9. Incident Response
- [ ] **Create incident response plan**
- [ ] **Define escalation procedures**
- [ ] **Document emergency contacts**
- [ ] **Set up emergency shutdown procedure**
- [ ] **Create communication templates**
- [ ] **Regular incident drills**
- [ ] **Post-mortem process defined**

### 10. Legal & Compliance
- [ ] **Consult with lawyer** about custody regulations
- [ ] **Review MSB requirements** (Money Service Business)
- [ ] **Check KYC/AML requirements** for your jurisdiction
- [ ] **Draft terms of service**
- [ ] **Create privacy policy**
- [ ] **Get insurance coverage** for custody (if available)
- [ ] **Implement transaction limits**

---

## 🟢 **RECOMMENDED** (Best Practices)

### 11. Backup & Recovery
- [ ] **Automated daily backups** (already implemented)
- [ ] **Test restore process monthly**
- [ ] **Store backups in different location**
- [ ] **Encrypt backup files**
- [ ] **Document recovery procedures**
- [ ] **Set up disaster recovery site**
- [ ] **Define RTO and RPO** (Recovery Time/Point Objective)

### 12. Testing
- [ ] **Write unit tests** for critical functions
- [ ] **Integration tests** for custody flows
- [ ] **Load testing** (simulate high traffic)
- [ ] **Security testing** (OWASP Top 10)
- [ ] **Test with testnet** before mainnet
- [ ] **User acceptance testing**
- [ ] **Regression testing** for updates

### 13. Access Control
- [ ] **Implement role-based access** (admin, support, viewer)
- [ ] **Enable 2FA** for all admin accounts
- [ ] **Regular access reviews**
- [ ] **Principle of least privilege**
- [ ] **Audit logs for admin actions**
- [ ] **Separate dev/staging/prod access**
- [ ] **Use hardware security keys** (YubiKey)

### 14. Code Security
- [ ] **Regular dependency updates**
- [ ] **Automated security scanning** (Snyk, Dependabot)
- [ ] **Code signing**
- [ ] **Protected main branch**
- [ ] **Require code reviews** for all changes
- [ ] **Run linters and security checks** in CI/CD
- [ ] **Static code analysis** (SonarQube)

### 15. User Communication
- [ ] **Clear security warnings** in UI
- [ ] **Educate users** about risks
- [ ] **Transparent about custody** model
- [ ] **Document dispute resolution** process
- [ ] **Set up support channels**
- [ ] **Regular security updates** to users

---

## 📊 Security Checklist Progress

Track your progress:

```
Critical (15 items):     [ ] 0/15   (0%)
High Priority (15 items): [ ] 0/15   (0%)
Recommended (15 items):   [ ] 0/15   (0%)

TOTAL: 0/45 (0%)
```

**Goal:** 100% of Critical + 80% of High Priority before production launch.

---

## 🛡️ Security Configuration Examples

### HTTPS Headers (Next.js)
Add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};
```

### Environment Variable Validation
Add to your startup script:

```javascript
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ESCROW_ENCRYPTION_KEY',
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

---

## 🚨 Security Incidents

### If Private Key Compromised
1. **Immediately** pause all custody operations
2. Generate new encryption key
3. Create new custody wallets for affected escrows
4. Transfer funds to new wallets
5. Update database with new encrypted keys
6. Investigate breach source
7. Notify affected users
8. File incident report

### If Database Breached
1. **Immediately** change all database credentials
2. Review audit logs for unauthorized access
3. Assess if encrypted keys were accessed
4. Rotate encryption keys if necessary
5. Notify users if personal data exposed
6. Implement additional security measures
7. Conduct full security audit

---

## 📞 Emergency Contacts

Document and share with team:

```
Security Team Lead: [Name] [Phone] [Email]
Database Admin: [Name] [Phone] [Email]
Infrastructure Lead: [Name] [Phone] [Email]
Legal Counsel: [Name] [Phone] [Email]
Insurance Provider: [Company] [Phone] [Policy #]
```

---

## 🔄 Regular Security Tasks

### Daily
- [ ] Monitor alerts
- [ ] Review error logs
- [ ] Check system health

### Weekly
- [ ] Review audit logs
- [ ] Check custody wallet balances
- [ ] Update dependencies
- [ ] Review rate limit violations

### Monthly
- [ ] Test backup restoration
- [ ] Review access logs
- [ ] Update security documentation
- [ ] Conduct security training

### Quarterly
- [ ] Rotate encryption keys
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review and update policies

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Web3 Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)

---

## ✅ Sign-Off

Before production launch, have these roles review and sign off:

- [ ] **CTO/Technical Lead:** ___________________ Date: _______
- [ ] **Security Engineer:** ___________________ Date: _______
- [ ] **Legal Counsel:** ___________________ Date: _______
- [ ] **CEO/Product Owner:** ___________________ Date: _______

---

**Remember:** Security is an ongoing process, not a one-time task. 

**Stay vigilant. Stay secure. 🔒**

---

**Last Updated:** November 6, 2025  
**Version:** 1.0  
**Status:** Living Document - Update as threats evolve

