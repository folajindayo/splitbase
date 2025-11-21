/**
 * Recipient Validation API Route
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipients } = body;

    if (!Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'Recipients must be an array' },
        { status: 400 }
      );
    }

    // Validate recipients
    const validated = recipients.map((recipient) => {
      const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(recipient.address);
      const isValidShare = recipient.share > 0 && recipient.share <= 100;

      return {
        ...recipient,
        isValid: isValidAddress && isValidShare,
        error: !isValidAddress
          ? 'Invalid address'
          : !isValidShare
          ? 'Invalid share percentage'
          : undefined,
      };
    });

    return NextResponse.json({ recipients: validated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}

