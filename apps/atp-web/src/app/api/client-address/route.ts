export const dynamic = 'force-dynamic';

/**
 * Server-side API route for getting the client address
 * Returns the address associated with the private key from the ClientApp singleton
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientApp } from '@agentic-trust/core/server';

export async function GET(request: NextRequest) {
  try {
    // Get client app account (session/AA or EOA) from ClientApp
    const clientApp = await getClientApp();
    const clientAppAccount = clientApp?.address;
    
    if (!clientAppAccount) {
      // Best-effort: return null so callers can fallback to wallet address
      return NextResponse.json(
        { clientAddress: null, warning: 'No client app account configured' },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      clientAddress: clientAppAccount,
    });
  } catch (error: unknown) {
    console.error('Error getting client app account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    // Best-effort: return null so callers can fallback to wallet address
    return NextResponse.json(
      { 
        clientAddress: null,
        warning: 'Failed to get client app account',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 200 }
    );
  }
}

