/**
 * Create Split API Route
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creator, totalAmount, token, recipients, chainId } = body;

    if (!creator || !totalAmount || !token || !recipients || !chainId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Implementation would call payment service
    const payment = {
      id: 'split-' + Date.now(),
      creator,
      totalAmount,
      token,
      recipients,
      status: 'pending',
      createdAt: new Date().toISOString(),
      chainId,
    };

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
