export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { D1Database } from '../../../../lib/db';
import { getD1Database } from '../../../../lib/d1-wrapper';

/**
 * POST /api/agents/session-package
 * Save sessionPackage JSON to agents table
 * Body: { ensName: string, sessionPackage: object }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[agents/session-package] POST request received');
    const body = await request.json();
    const { ensName, sessionPackage } = body;

    if (!ensName || typeof ensName !== 'string') {
      return NextResponse.json(
        { error: 'ensName is required and must be a string' },
        { status: 400 }
      );
    }

    if (!sessionPackage || typeof sessionPackage !== 'object') {
      return NextResponse.json(
        { error: 'sessionPackage is required and must be an object' },
        { status: 400 }
      );
    }

    console.log('[agents/session-package] Getting database connection...');
    const db = await getD1Database();
    if (!db) {
      console.error('[agents/session-package] Database not available');
      return NextResponse.json(
        { 
          error: 'Database not available',
          message: 'D1 database binding is not configured. For local development, ensure USE_REMOTE_D1=true, CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_API_TOKEN are set in .env.local, or use "wrangler pages dev .next".',
        },
        { status: 500 }
      );
    }
    console.log('[agents/session-package] Database connection obtained');

    // Check if agent exists
    console.log('[agents/session-package] Checking if agent exists:', ensName);
    const existing = await db.prepare(
      'SELECT id FROM agents WHERE ens_name = ?'
    ).bind(ensName).first<{ id: number }>();

    if (!existing) {
      return NextResponse.json(
        { error: 'Agent not found for ENS name', ensName },
        { status: 404 }
      );
    }

    // Convert sessionPackage object to JSON string
    const sessionPackageJson = JSON.stringify(sessionPackage);
    const now = Math.floor(Date.now() / 1000);

    // Update agent with sessionPackage
    console.log('[agents/session-package] Updating agent with sessionPackage');
    await db.prepare(
      `UPDATE agents 
       SET session_package = ?, updated_at = ?
       WHERE ens_name = ?`
    ).bind(sessionPackageJson, now, ensName).run();

    console.log('[agents/session-package] Session package saved successfully');

    return NextResponse.json({ 
      success: true,
      ensName,
      message: 'Session package saved successfully',
    });
  } catch (error) {
    console.error('[agents/session-package] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save session package',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/session-package?ensName=...
 * Get sessionPackage JSON from agents table
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[agents/session-package] GET request received');
    const searchParams = request.nextUrl.searchParams;
    const ensName = searchParams.get('ensName');

    if (!ensName) {
      return NextResponse.json(
        { error: 'ensName parameter is required' },
        { status: 400 }
      );
    }

    console.log('[agents/session-package] Getting database connection...');
    const db = await getD1Database();
    if (!db) {
      console.error('[agents/session-package] Database not available');
      return NextResponse.json(
        { 
          error: 'Database not available',
          message: 'D1 database binding is not configured.',
        },
        { status: 500 }
      );
    }

    // Get agent with sessionPackage
    console.log('[agents/session-package] Fetching agent:', ensName);
    const agent = await db.prepare(
      'SELECT session_package FROM agents WHERE ens_name = ?'
    ).bind(ensName).first<{ session_package: string | null }>();

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found', ensName },
        { status: 404 }
      );
    }

    if (!agent.session_package) {
      return NextResponse.json(
        { error: 'Session package not found for agent', ensName },
        { status: 404 }
      );
    }

    // Parse and return sessionPackage
    try {
      const sessionPackage = JSON.parse(agent.session_package);
      return NextResponse.json({ sessionPackage, ensName });
    } catch (error) {
      console.error('[agents/session-package] Error parsing sessionPackage JSON:', error);
      return NextResponse.json(
        { error: 'Failed to parse session package JSON' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[agents/session-package] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get session package',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

