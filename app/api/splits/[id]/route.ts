/**
 * Split Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Implementation would call payment service
    const split = {
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: split,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
