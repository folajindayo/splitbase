export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  recipientName: string;
  recipientEmail: string;
  [key: string]: any;
}

class EmailTemplateSystem {
  private static instance: EmailTemplateSystem;
  private readonly baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://splitbase.com';
  private readonly supportEmail = process.env.SUPPORT_EMAIL || 'support@splitbase.com';

  private constructor() {}

  static getInstance(): EmailTemplateSystem {
    if (!EmailTemplateSystem.instance) {
      EmailTemplateSystem.instance = new EmailTemplateSystem();
    }
    return EmailTemplateSystem.instance;
  }

  // Base email layout
  private getBaseLayout(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Splitbase</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 32px;
      font-weight: bold;
      text-decoration: none;
    }
    .content {
      padding: 40px 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 32px;
      background-color: #667eea;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      margin: 0 0 16px 0;
    }
    p {
      color: #4b5563;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    .highlight {
      background-color: #f3f4f6;
      padding: 16px;
      border-left: 4px solid #667eea;
      margin: 20px 0;
    }
    .divider {
      border: 0;
      border-top: 1px solid #e5e7eb;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${this.baseUrl}" class="logo">Splitbase</a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent by Splitbase</p>
      <p>
        <a href="${this.baseUrl}">Visit Website</a> •
        <a href="${this.baseUrl}/help">Help Center</a> •
        <a href="mailto:${this.supportEmail}">Contact Support</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px;">
        © ${new Date().getFullYear()} Splitbase. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Welcome email
  welcomeEmail(data: EmailData): EmailTemplate {
    const html = this.getBaseLayout(`
      <h1>Welcome to Splitbase, ${data.recipientName}! 🎉</h1>
      <p>
        We're thrilled to have you join our secure custodial escrow platform.
        Your account has been successfully created and is ready to use.
      </p>
      <p>
        With Splitbase, you can safely manage your escrow transactions with
        complete transparency and security.
      </p>
      <div class="highlight">
        <p style="margin: 0; font-weight: 600;">Get Started:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Create your first escrow transaction</li>
          <li>Complete your profile verification</li>
          <li>Explore our security features</li>
        </ul>
      </div>
      <a href="${this.baseUrl}/dashboard" class="button">Go to Dashboard</a>
      <hr class="divider" />
      <p>
        Need help? Our support team is here for you 24/7 at
        <a href="mailto:${this.supportEmail}">${this.supportEmail}</a>
      </p>
    `);

    const text = `
Welcome to Splitbase, ${data.recipientName}!

We're thrilled to have you join our secure custodial escrow platform.
Your account has been successfully created and is ready to use.

Get Started:
- Create your first escrow transaction
- Complete your profile verification
- Explore our security features

Visit your dashboard: ${this.baseUrl}/dashboard

Need help? Contact us at ${this.supportEmail}

© ${new Date().getFullYear()} Splitbase. All rights reserved.
    `;

    return {
      subject: 'Welcome to Splitbase!',
      html,
      text,
    };
  }

  // Escrow created email
  escrowCreated(data: EmailData & {
    escrowId: string;
    amount: number;
    currency: string;
    otherParty: string;
  }): EmailTemplate {
    const html = this.getBaseLayout(`
      <h1>Escrow Transaction Created</h1>
      <p>Hello ${data.recipientName},</p>
      <p>
        A new escrow transaction has been created. Here are the details:
      </p>
      <div class="highlight">
        <p><strong>Transaction ID:</strong> ${data.escrowId}</p>
        <p><strong>Amount:</strong> ${data.currency} ${data.amount.toLocaleString()}</p>
        <p><strong>Other Party:</strong> ${data.otherParty}</p>
      </div>
      <p>
        Both parties must review and confirm the transaction terms before
        funds can be deposited.
      </p>
      <a href="${this.baseUrl}/escrow/${data.escrowId}" class="button">View Transaction</a>
      <hr class="divider" />
      <p style="font-size: 14px; color: #6b7280;">
        If you did not initiate this transaction, please contact support immediately.
      </p>
    `);

    const text = `
Escrow Transaction Created

Hello ${data.recipientName},

A new escrow transaction has been created:

Transaction ID: ${data.escrowId}
Amount: ${data.currency} ${data.amount.toLocaleString()}
Other Party: ${data.otherParty}

View transaction: ${this.baseUrl}/escrow/${data.escrowId}

If you did not initiate this transaction, please contact support immediately.

© ${new Date().getFullYear()} Splitbase. All rights reserved.
    `;

    return {
      subject: `Escrow Transaction Created - ${data.escrowId}`,
      html,
      text,
    };
  }

  // Funds deposited email
  fundsDeposited(data: EmailData & {
    escrowId: string;
    amount: number;
    currency: string;
  }): EmailTemplate {
    const html = this.getBaseLayout(`
      <h1>Funds Deposited Successfully ✓</h1>
      <p>Hello ${data.recipientName},</p>
      <p>
        The funds for your escrow transaction have been successfully deposited
        and are now being held securely.
      </p>
      <div class="highlight">
        <p><strong>Transaction ID:</strong> ${data.escrowId}</p>
        <p><strong>Amount Deposited:</strong> ${data.currency} ${data.amount.toLocaleString()}</p>
        <p><strong>Status:</strong> <span style="color: #10b981;">Secured</span></p>
      </div>
      <p>
        The funds will be released once all transaction conditions are met
        and both parties confirm completion.
      </p>
      <a href="${this.baseUrl}/escrow/${data.escrowId}" class="button">View Transaction</a>
    `);

    const text = `
Funds Deposited Successfully

Hello ${data.recipientName},

The funds for your escrow transaction have been successfully deposited.

Transaction ID: ${data.escrowId}
Amount: ${data.currency} ${data.amount.toLocaleString()}
Status: Secured

View transaction: ${this.baseUrl}/escrow/${data.escrowId}

© ${new Date().getFullYear()} Splitbase. All rights reserved.
    `;

    return {
      subject: `Funds Deposited - ${data.escrowId}`,
      html,
      text,
    };
  }

  // Funds released email
  fundsReleased(data: EmailData & {
    escrowId: string;
    amount: number;
    currency: string;
    releasedTo: string;
  }): EmailTemplate {
    const html = this.getBaseLayout(`
      <h1>Funds Released Successfully ✓</h1>
      <p>Hello ${data.recipientName},</p>
      <p>
        The escrow funds have been released as agreed.
      </p>
      <div class="highlight">
        <p><strong>Transaction ID:</strong> ${data.escrowId}</p>
        <p><strong>Amount Released:</strong> ${data.currency} ${data.amount.toLocaleString()}</p>
        <p><strong>Released To:</strong> ${data.releasedTo}</p>
        <p><strong>Status:</strong> <span style="color: #10b981;">Completed</span></p>
      </div>
      <p>
        The transaction is now complete. Thank you for using Splitbase!
      </p>
      <a href="${this.baseUrl}/escrow/${data.escrowId}" class="button">View Transaction</a>
      <hr class="divider" />
      <p>
        We'd love to hear about your experience. Please take a moment to
        <a href="${this.baseUrl}/feedback">provide feedback</a>.
      </p>
    `);

    const text = `
Funds Released Successfully

Hello ${data.recipientName},

The escrow funds have been released as agreed.

Transaction ID: ${data.escrowId}
Amount: ${data.currency} ${data.amount.toLocaleString()}
Released To: ${data.releasedTo}
Status: Completed

View transaction: ${this.baseUrl}/escrow/${data.escrowId}

© ${new Date().getFullYear()} Splitbase. All rights reserved.
    `;

    return {
      subject: `Funds Released - ${data.escrowId}`,
      html,
      text,
    };
  }

  // Dispute opened email
  disputeOpened(data: EmailData & {
    escrowId: string;
    disputeId: string;
    reason: string;
  }): EmailTemplate {
    const html = this.getBaseLayout(`
      <h1>⚠️ Dispute Opened</h1>
      <p>Hello ${data.recipientName},</p>
      <p>
        A dispute has been opened for your escrow transaction. Our support
        team will review the case and work towards a resolution.
      </p>
      <div class="highlight">
        <p><strong>Transaction ID:</strong> ${data.escrowId}</p>
        <p><strong>Dispute ID:</strong> ${data.disputeId}</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
      </div>
      <p>
        You can submit evidence and communicate with our mediation team
        through the dispute portal.
      </p>
      <a href="${this.baseUrl}/disputes/${data.disputeId}" class="button">View Dispute</a>
      <hr class="divider" />
      <p style="font-size: 14px; color: #6b7280;">
        Our team will review all evidence and make a fair determination within
        3-5 business days.
      </p>
    `);

    const text = `
Dispute Opened

Hello ${data.recipientName},

A dispute has been opened for your escrow transaction.

Transaction ID: ${data.escrowId}
Dispute ID: ${data.disputeId}
Reason: ${data.reason}

View dispute: ${this.baseUrl}/disputes/${data.disputeId}

© ${new Date().getFullYear()} Splitbase. All rights reserved.
    `;

    return {
      subject: `Dispute Opened - ${data.escrowId}`,
      html,
      text,
    };
  }

  // Password reset email
  passwordReset(data: EmailData & {
    resetToken: string;
    expiresIn: number;
  }): EmailTemplate {
    const resetLink = `${this.baseUrl}/reset-password?token=${data.resetToken}`;
    
    const html = this.getBaseLayout(`
      <h1>Reset Your Password</h1>
      <p>Hello ${data.recipientName},</p>
      <p>
        We received a request to reset your password. Click the button below
        to create a new password:
      </p>
      <a href="${resetLink}" class="button">Reset Password</a>
      <p style="font-size: 14px; color: #6b7280;">
        This link will expire in ${data.expiresIn} minutes.
      </p>
      <hr class="divider" />
      <p style="font-size: 14px; color: #6b7280;">
        If you didn't request a password reset, you can safely ignore this email.
        Your password will remain unchanged.
      </p>
      <p style="font-size: 14px; color: #6b7280;">
        For security reasons, never share this email or link with anyone.
      </p>
    `);

    const text = `
Reset Your Password

Hello ${data.recipientName},

We received a request to reset your password. Use the link below to create a new password:

${resetLink}

This link will expire in ${data.expiresIn} minutes.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} Splitbase. All rights reserved.
    `;

    return {
      subject: 'Reset Your Password',
      html,
      text,
    };
  }

  // Email verification
  emailVerification(data: EmailData & {
    verificationToken: string;
  }): EmailTemplate {
    const verificationLink = `${this.baseUrl}/verify-email?token=${data.verificationToken}`;
    
    const html = this.getBaseLayout(`
      <h1>Verify Your Email Address</h1>
      <p>Hello ${data.recipientName},</p>
      <p>
        Thank you for signing up! Please verify your email address to
        complete your registration and access all features.
      </p>
      <a href="${verificationLink}" class="button">Verify Email</a>
      <hr class="divider" />
      <p style="font-size: 14px; color: #6b7280;">
        If you didn't create an account with Splitbase, you can safely ignore this email.
      </p>
    `);

    const text = `
Verify Your Email Address

Hello ${data.recipientName},

Thank you for signing up! Please verify your email address:

${verificationLink}

If you didn't create an account with Splitbase, you can ignore this email.

© ${new Date().getFullYear()} Splitbase. All rights reserved.
    `;

    return {
      subject: 'Verify Your Email Address',
      html,
      text,
    };
  }

  // Security alert email
  securityAlert(data: EmailData & {
    alertType: string;
    details: string;
    ipAddress?: string;
    location?: string;
  }): EmailTemplate {
    const html = this.getBaseLayout(`
      <h1>🔒 Security Alert</h1>
      <p>Hello ${data.recipientName},</p>
      <p>
        We detected unusual activity on your account and wanted to let you know.
      </p>
      <div class="highlight" style="border-left-color: #ef4444;">
        <p><strong>Alert Type:</strong> ${data.alertType}</p>
        <p><strong>Details:</strong> ${data.details}</p>
        ${data.ipAddress ? `<p><strong>IP Address:</strong> ${data.ipAddress}</p>` : ''}
        ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
      </div>
      <p>
        If this was you, you can safely ignore this email. If you don't
        recognize this activity, please secure your account immediately.
      </p>
      <a href="${this.baseUrl}/security" class="button">Review Security Settings</a>
      <hr class="divider" />
      <p style="font-size: 14px; color: #ef4444;">
        If you believe your account has been compromised, please contact
        support immediately at ${this.supportEmail}
      </p>
    `);

    const text = `
Security Alert

Hello ${data.recipientName},

We detected unusual activity on your account.

Alert Type: ${data.alertType}
Details: ${data.details}
${data.ipAddress ? `IP Address: ${data.ipAddress}` : ''}
${data.location ? `Location: ${data.location}` : ''}

If this wasn't you, please secure your account: ${this.baseUrl}/security

Contact support: ${this.supportEmail}

© ${new Date().getFullYear()} Splitbase. All rights reserved.
    `;

    return {
      subject: 'Security Alert - Unusual Activity Detected',
      html,
      text,
    };
  }

  // Monthly statement email
  monthlyStatement(data: EmailData & {
    month: string;
    year: number;
    totalTransactions: number;
    totalVolume: number;
    currency: string;
  }): EmailTemplate {
    const html = this.getBaseLayout(`
      <h1>Your ${data.month} ${data.year} Statement</h1>
      <p>Hello ${data.recipientName},</p>
      <p>
        Here's a summary of your escrow activity for ${data.month} ${data.year}.
      </p>
      <div class="highlight">
        <p><strong>Total Transactions:</strong> ${data.totalTransactions}</p>
        <p><strong>Total Volume:</strong> ${data.currency} ${data.totalVolume.toLocaleString()}</p>
      </div>
      <a href="${this.baseUrl}/statements" class="button">View Full Statement</a>
      <hr class="divider" />
      <p style="font-size: 14px; color: #6b7280;">
        Thank you for trusting Splitbase with your transactions!
      </p>
    `);

    const text = `
Your ${data.month} ${data.year} Statement

Hello ${data.recipientName},

Here's your activity summary:

Total Transactions: ${data.totalTransactions}
Total Volume: ${data.currency} ${data.totalVolume.toLocaleString()}

View full statement: ${this.baseUrl}/statements

© ${new Date().getFullYear()} Splitbase. All rights reserved.
    `;

    return {
      subject: `Your ${data.month} ${data.year} Statement`,
      html,
      text,
    };
  }
}

// Export singleton instance
export const emailTemplates = EmailTemplateSystem.getInstance();

// Export convenience functions
export const getWelcomeEmail = (data: EmailData) =>
  emailTemplates.welcomeEmail(data);

export const getEscrowCreatedEmail = (data: EmailData & any) =>
  emailTemplates.escrowCreated(data);

export const getFundsDepositedEmail = (data: EmailData & any) =>
  emailTemplates.fundsDeposited(data);

export const getFundsReleasedEmail = (data: EmailData & any) =>
  emailTemplates.fundsReleased(data);

export const getDisputeOpenedEmail = (data: EmailData & any) =>
  emailTemplates.disputeOpened(data);

export const getPasswordResetEmail = (data: EmailData & any) =>
  emailTemplates.passwordReset(data);

export const getEmailVerificationEmail = (data: EmailData & any) =>
  emailTemplates.emailVerification(data);

export const getSecurityAlertEmail = (data: EmailData & any) =>
  emailTemplates.securityAlert(data);

export const getMonthlyStatementEmail = (data: EmailData & any) =>
  emailTemplates.monthlyStatement(data);

