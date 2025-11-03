// Email notification utilities
// This module provides email notification functionality for the SplitBase app

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  splitAddress?: string;
  txHash?: string;
  amount?: string;
}

/**
 * Send email notification via API route
 */
export async function sendEmail(notification: EmailNotification): Promise<boolean> {
  try {
    const response = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to send email:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Generate HTML for distribution notification
 */
export function generateDistributionEmailHTML(
  splitName: string,
  splitAddress: string,
  amount: string,
  percentage: number,
  recipientAmount: string,
  txHash: string,
  chainId: number
): string {
  const explorerUrl = chainId === 84532
    ? `https://sepolia.basescan.org/tx/${txHash}`
    : `https://basescan.org/tx/${txHash}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">💸 Payment Received</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Great news! You've received a payment from <strong>${splitName}</strong>.
              </p>
              
              <!-- Payment Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Total Received:</td>
                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111827; text-align: right;">${amount} ETH</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Your Share (${percentage}%):</td>
                    <td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #10b981; text-align: right;">${recipientAmount} ETH</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Split Contract:</td>
                    <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #111827; text-align: right;">${splitAddress.slice(0, 10)}...${splitAddress.slice(-8)}</td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="margin: 32px 0;">
                <a href="${explorerUrl}" style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View Transaction
                </a>
              </div>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                The funds have been automatically distributed to your wallet. You can view the transaction details on BaseScan by clicking the button above.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                You're receiving this email because you're a recipient in the ${splitName} split contract on SplitBase.
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                <a href="https://splitbase.app/splits/${splitAddress}" style="color: #3b82f6; text-decoration: none;">Manage your split</a> • 
                <a href="https://splitbase.app" style="color: #3b82f6; text-decoration: none;">Visit SplitBase</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate HTML for split creation notification
 */
export function generateSplitCreatedEmailHTML(
  splitName: string,
  splitAddress: string,
  recipientCount: number,
  chainId: number
): string {
  const explorerUrl = chainId === 84532
    ? `https://sepolia.basescan.org/address/${splitAddress}`
    : `https://basescan.org/address/${splitAddress}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Split Contract Created</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">🎉 Split Contract Created!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Your split contract <strong>${splitName}</strong> has been successfully deployed on Base!
              </p>
              
              <!-- Contract Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Split Name:</td>
                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111827; text-align: right;">${splitName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Recipients:</td>
                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111827; text-align: right;">${recipientCount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Contract Address:</td>
                    <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #111827; text-align: right;">${splitAddress.slice(0, 10)}...${splitAddress.slice(-8)}</td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="margin: 32px 0;">
                <a href="${explorerUrl}" style="display: inline-block; padding: 12px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View Contract
                </a>
              </div>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                You can now share this contract address to start receiving payments. All funds sent to this address will be automatically distributed according to your configured percentages.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                <a href="https://splitbase.app/splits/${splitAddress}" style="color: #3b82f6; text-decoration: none;">Manage your split</a> • 
                <a href="https://splitbase.app/dashboard" style="color: #3b82f6; text-decoration: none;">View Dashboard</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate HTML for escrow created notification
 */
export function generateEscrowCreatedEmailHTML(
  escrowTitle: string,
  escrowId: string,
  amount: string,
  currency: string,
  sellerAddress: string,
  escrowType: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Escrow Created</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">🔒 Escrow Created</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                An escrow agreement has been created: <strong>${escrowTitle}</strong>
              </p>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Amount:</td>
                    <td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #111827; text-align: right;">${amount} ${currency}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Type:</td>
                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111827; text-align: right;">${escrowType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Seller:</td>
                    <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #111827; text-align: right;">${sellerAddress.slice(0, 10)}...${sellerAddress.slice(-8)}</td>
                  </tr>
                </table>
              </div>
              <div style="margin: 32px 0;">
                <a href="https://splitbase.app/escrow/${escrowId}" style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View Escrow Details
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                <a href="https://splitbase.app/escrow" style="color: #3b82f6; text-decoration: none;">View all escrows</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate HTML for escrow funded notification
 */
export function generateEscrowFundedEmailHTML(
  escrowTitle: string,
  escrowId: string,
  amount: string,
  currency: string,
  txHash: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Escrow Funded</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">✅ Escrow Funded</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Great news! The escrow <strong>${escrowTitle}</strong> has been funded.
              </p>
              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #86efac;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #15803d;">Amount:</td>
                    <td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #15803d; text-align: right;">${amount} ${currency}</td>
                  </tr>
                </table>
              </div>
              <div style="margin: 32px 0;">
                <a href="https://splitbase.app/escrow/${escrowId}" style="display: inline-block; padding: 12px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View Escrow
                </a>
              </div>
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                Transaction: <span style="font-family: monospace; font-size: 12px;">${txHash.slice(0, 10)}...${txHash.slice(-8)}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate HTML for milestone completed notification
 */
export function generateMilestoneCompletedEmailHTML(
  escrowTitle: string,
  escrowId: string,
  milestoneTitle: string,
  amount: string,
  currency: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Milestone Completed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">🎯 Milestone Completed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                A milestone has been marked as completed in <strong>${escrowTitle}</strong>.
              </p>
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #93c5fd;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #1e40af;">Milestone:</td>
                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #1e40af; text-align: right;">${milestoneTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #1e40af;">Amount:</td>
                    <td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #1e40af; text-align: right;">${amount} ${currency}</td>
                  </tr>
                </table>
              </div>
              <div style="margin: 32px 0;">
                <a href="https://splitbase.app/escrow/${escrowId}" style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  Review & Release Payment
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate HTML for funds released notification
 */
export function generateFundsReleasedEmailHTML(
  escrowTitle: string,
  escrowId: string,
  amount: string,
  currency: string,
  isMilestone: boolean,
  milestoneTitle?: string
): string {
  const title = isMilestone ? `💰 Milestone Payment Released` : `💰 Escrow Funds Released`;
  const message = isMilestone 
    ? `Payment for milestone <strong>${milestoneTitle}</strong> in escrow <strong>${escrowTitle}</strong> has been released.`
    : `The full amount for escrow <strong>${escrowTitle}</strong> has been released.`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Funds Released</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                ${message}
              </p>
              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #86efac;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #15803d;">Released Amount:</td>
                    <td style="padding: 8px 0; font-size: 24px; font-weight: 700; color: #15803d; text-align: right;">${amount} ${currency}</td>
                  </tr>
                </table>
              </div>
              <div style="margin: 32px 0;">
                <a href="https://splitbase.app/escrow/${escrowId}" style="display: inline-block; padding: 12px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View Escrow Details
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

