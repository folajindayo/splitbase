import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.NEXT_PUBLIC_FROM_EMAIL || "noreply@splitbase.com";

/**
 * Generate email HTML for custody wallet created
 */
export function generateCustodyWalletCreatedEmailHTML(
  escrowTitle: string,
  custodyAddress: string,
  amount: string,
  currency: string,
  escrowUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .wallet-box { background: white; border: 2px solid #667eea; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .address { font-family: monospace; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; }
    .amount { font-size: 28px; font-weight: bold; color: #667eea; margin: 10px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Custody Wallet Created</h1>
      <p>Your escrow is ready for funding</p>
    </div>
    <div class="content">
      <h2>Escrow: ${escrowTitle}</h2>
      
      <div class="wallet-box">
        <h3>Your Secure Custody Wallet</h3>
        <p>SplitBase has created a unique custody wallet for this escrow. Your funds will be held securely until release.</p>
        
        <div class="amount">${amount} ${currency}</div>
        
        <p style="margin-top: 20px;"><strong>Deposit Address:</strong></p>
        <div class="address">${custodyAddress}</div>
      </div>

      <div class="warning">
        <strong>⚠️ Important:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Send funds only from your personal wallet</li>
          <li>Do not send from an exchange</li>
          <li>Network: Base Sepolia (testnet)</li>
          <li>Funds will be detected automatically</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${escrowUrl}" class="button">View Escrow & Deposit</a>
      </div>

      <h3>How It Works:</h3>
      <ol>
        <li><strong>Deposit:</strong> Send ${amount} ${currency} to the custody address</li>
        <li><strong>Auto-Detect:</strong> System confirms your deposit automatically</li>
        <li><strong>Secure Hold:</strong> SplitBase holds funds in custody</li>
        <li><strong>Release:</strong> You approve release when satisfied</li>
      </ol>

      <p><strong>Why Custody?</strong></p>
      <p>SplitBase acts as a trusted intermediary, holding your funds securely with encrypted private keys. This provides security without smart contract complexity.</p>
    </div>
    <div class="footer">
      <p>This is an automated email from SplitBase</p>
      <p>Escrow ID: ${escrowTitle}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate email HTML for funds released from custody
 */
export function generateCustodyFundsReleasedEmailHTML(
  escrowTitle: string,
  amount: string,
  currency: string,
  txHash: string,
  recipientAddress: string,
  escrowUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-box { background: #d1fae5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .amount { font-size: 32px; font-weight: bold; color: #059669; margin: 10px 0; }
    .tx-hash { font-family: monospace; font-size: 11px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Funds Released!</h1>
      <p>Payment sent from custody to recipient</p>
    </div>
    <div class="content">
      <h2>Escrow: ${escrowTitle}</h2>
      
      <div class="success-box">
        <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
        <p style="font-size: 18px; margin: 10px 0;"><strong>Payment Successful</strong></p>
        <div class="amount">${amount} ${currency}</div>
        <p style="color: #059669;">Sent to recipient</p>
      </div>

      <h3>Transaction Details:</h3>
      <p><strong>Recipient:</strong></p>
      <div class="tx-hash">${recipientAddress}</div>
      
      <p style="margin-top: 15px;"><strong>Transaction Hash:</strong></p>
      <div class="tx-hash">${txHash}</div>

      <div style="text-align: center;">
        <a href="${escrowUrl}" class="button">View Escrow Details</a>
      </div>

      <p><strong>What Happened?</strong></p>
      <p>The funds were automatically released from our secure custody wallet to the recipient's address. Gas fees were calculated and deducted automatically.</p>
    </div>
    <div class="footer">
      <p>This is an automated email from SplitBase</p>
      <p>Escrow: ${escrowTitle}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate email HTML for funds refunded from custody
 */
export function generateCustodyFundsRefundedEmailHTML(
  escrowTitle: string,
  amount: string,
  currency: string,
  txHash: string,
  escrowUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .refund-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .amount { font-size: 32px; font-weight: bold; color: #d97706; margin: 10px 0; }
    .tx-hash { font-family: monospace; font-size: 11px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>↩️ Funds Refunded</h1>
      <p>Escrow cancelled - funds returned</p>
    </div>
    <div class="content">
      <h2>Escrow: ${escrowTitle}</h2>
      
      <div class="refund-box">
        <div style="font-size: 48px; margin-bottom: 10px;">↩️</div>
        <p style="font-size: 18px; margin: 10px 0;"><strong>Refund Processed</strong></p>
        <div class="amount">${amount} ${currency}</div>
        <p style="color: #d97706;">Returned to your wallet</p>
      </div>

      <p><strong>Transaction Hash:</strong></p>
      <div class="tx-hash">${txHash}</div>

      <div style="text-align: center;">
        <a href="${escrowUrl}" class="button">View Escrow Details</a>
      </div>

      <p><strong>What Happened?</strong></p>
      <p>The escrow was cancelled and your funds have been automatically refunded from our custody wallet back to your address. Gas fees were deducted from the total.</p>
    </div>
    <div class="footer">
      <p>This is an automated email from SplitBase</p>
      <p>Escrow: ${escrowTitle}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send custody wallet created email
 */
export async function sendCustodyWalletCreatedEmail(
  toEmail: string,
  escrowTitle: string,
  custodyAddress: string,
  amount: string,
  currency: string,
  escrowUrl: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log("Resend API key not configured - skipping email");
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `🔒 Custody Wallet Created - ${escrowTitle}`,
      html: generateCustodyWalletCreatedEmailHTML(
        escrowTitle,
        custodyAddress,
        amount,
        currency,
        escrowUrl
      ),
    });
  } catch (error) {
    console.error("Error sending custody wallet created email:", error);
  }
}

/**
 * Send custody funds released email
 */
export async function sendCustodyFundsReleasedEmail(
  toEmail: string,
  escrowTitle: string,
  amount: string,
  currency: string,
  txHash: string,
  recipientAddress: string,
  escrowUrl: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log("Resend API key not configured - skipping email");
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `✅ Funds Released - ${escrowTitle}`,
      html: generateCustodyFundsReleasedEmailHTML(
        escrowTitle,
        amount,
        currency,
        txHash,
        recipientAddress,
        escrowUrl
      ),
    });
  } catch (error) {
    console.error("Error sending custody funds released email:", error);
  }
}

/**
 * Send custody funds refunded email
 */
export async function sendCustodyFundsRefundedEmail(
  toEmail: string,
  escrowTitle: string,
  amount: string,
  currency: string,
  txHash: string,
  escrowUrl: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log("Resend API key not configured - skipping email");
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `↩️ Funds Refunded - ${escrowTitle}`,
      html: generateCustodyFundsRefundedEmailHTML(
        escrowTitle,
        amount,
        currency,
        txHash,
        escrowUrl
      ),
    });
  } catch (error) {
    console.error("Error sending custody funds refunded email:", error);
  }
}

