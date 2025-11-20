/**
 * Create Split API Route
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipients } = body;

    if (!recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'Recipients array is required' },
        { status: 400 }
      );
    }

    // In production, this would deploy a split contract
    const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);

    return NextResponse.json({ address: mockAddress });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
