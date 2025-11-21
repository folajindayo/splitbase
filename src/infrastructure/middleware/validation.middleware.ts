/**
 * Validation Middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';

export function validationMiddleware(schema: ZodSchema) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validated = schema.parse(body);
      
      // Attach validated data to request
      return NextResponse.next();
    } catch (error: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
  };
}

