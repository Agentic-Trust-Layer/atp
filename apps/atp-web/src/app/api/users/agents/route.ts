export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { D1Database } from '../../../../lib/db';
import { getD1Database } from '../../../../lib/d1-wrapper';

/**
 * GET /api/users/agents?email=...
 * POST /api/users/agents - Associate user with an agent
 */
async function getDB(): Promise<D1Database | null> {
  // Use the D1 wrapper which handles both native binding and Wrangler CLI fallback
  return await getD1Database();
}

export async function GET(request: NextRequest) {
  try {
    console.log('[users/agents] GET request received');
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    console.log('[users/agents] Getting database connection...');
    const db = await getDB();
    if (!db) {
      console.error('[users/agents] Database not available');
      const useRemote = process.env.USE_REMOTE_D1 === 'true';
      return NextResponse.json(
        { 
          error: 'Database not available',
          message: useRemote 
            ? 'D1 database remote access requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables. Set USE_REMOTE_D1=true and provide Cloudflare credentials.'
            : 'D1 database binding is not configured. Set USE_REMOTE_D1=true in .env.local with CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN, or use "wrangler pages dev .next" for local development.',
          setupInstructions: {
            remoteAccess: 'Set in .env.local: USE_REMOTE_D1=true, CLOUDFLARE_ACCOUNT_ID=..., CLOUDFLARE_API_TOKEN=...',
            localDev: 'Run: pnpm build && wrangler pages dev .next',
            production: 'Deploy to Cloudflare Pages - DB binding is automatic'
          }
        },
        { status: 500 }
      );
    }
    console.log('[users/agents] Database connection obtained');

    // Get account ID
    const account = await db.prepare(
      'SELECT id FROM accounts WHERE email = ?'
    ).bind(email).first<{ id: number }>();

    if (!account) {
      return NextResponse.json({ agents: [] });
    }

    // Get all agents for this account
    const associations = await db.prepare(
      `SELECT a.*, aa.is_primary, aa.role
       FROM account_agents aa
       JOIN agents a ON aa.agent_id = a.id
       WHERE aa.account_id = ?
       ORDER BY aa.is_primary DESC, aa.created_at ASC`
    ).bind(account.id).all<{
      id: number;
      ens_name: string;
      agent_name: string;
      email_domain: string;
      agent_account: string | null;
      chain_id: number;
      is_primary: number; // SQLite stores boolean as 0/1
      role: string | null;
    }>();

    const agents = (associations.results || []).map((row) => ({
      ens_name: row.ens_name,
      agent_name: row.agent_name,
      email_domain: row.email_domain,
      agent_account: row.agent_account,
      chain_id: row.chain_id,
      is_primary: row.is_primary === 1,
      role: row.role,
    }));

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('[users/agents] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get user agents',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[users/agents] POST request received');
    const body = await request.json();
    const {
      email,
      ens_name,
      agent_name,
      email_domain,
      agent_account,
      chain_id,
      is_primary,
      role,
    } = body;

    if (!email || !ens_name || !agent_name || !email_domain) {
      return NextResponse.json(
        { error: 'Missing required fields: email, ens_name, agent_name, email_domain' },
        { status: 400 }
      );
    }

    console.log('[users/agents] Getting database connection...');
    const db = await getDB();
    if (!db) {
      console.error('[users/agents] Database not available');
      const useRemote = process.env.USE_REMOTE_D1 === 'true';
      return NextResponse.json(
        { 
          error: 'Database not available',
          message: useRemote 
            ? 'D1 database remote access requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables. Set USE_REMOTE_D1=true and provide Cloudflare credentials.'
            : 'D1 database binding is not configured. Set USE_REMOTE_D1=true in .env.local with CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN, or use "wrangler pages dev .next" for local development.',
          setupInstructions: {
            remoteAccess: 'Set in .env.local: USE_REMOTE_D1=true, CLOUDFLARE_ACCOUNT_ID=..., CLOUDFLARE_API_TOKEN=...',
            localDev: 'Run: pnpm build && wrangler pages dev .next',
            production: 'Deploy to Cloudflare Pages - DB binding is automatic'
          }
        },
        { status: 500 }
      );
    }
    console.log('[users/agents] Database connection obtained');

    // Get or create account
    let account = await db.prepare(
      'SELECT id FROM accounts WHERE email = ?'
    ).bind(email).first<{ id: number }>();

    if (!account) {
      // Create account if it doesn't exist
      const now = Math.floor(Date.now() / 1000);
      const insertResult = await db.prepare(
        'INSERT INTO accounts (email, created_at, updated_at) VALUES (?, ?, ?)'
      ).bind(email, now, now).run();
      
      account = { id: Number(insertResult.meta.last_row_id) };
    }

    // Get or create agent
    let agent = await db.prepare(
      'SELECT id FROM agents WHERE ens_name = ?'
    ).bind(ens_name).first<{ id: number }>();

    if (!agent) {
      // Create agent if it doesn't exist
      const now = Math.floor(Date.now() / 1000);
      const resolvedChainId = chain_id || 11155111;
      
      const insertResult = await db.prepare(
        `INSERT INTO agents 
         (ens_name, agent_name, email_domain, 
          agent_account, chain_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        ens_name,
        agent_name,
        email_domain,
        agent_account || null,
        resolvedChainId,
        now,
        now
      ).run();

      agent = { id: Number(insertResult.meta.last_row_id) };
    } else {
      // Update agent if it exists
      const now = Math.floor(Date.now() / 1000);
      await db.prepare(
        `UPDATE agents 
         SET agent_name = ?, agent_account = ?, updated_at = ?
         WHERE ens_name = ?`
      ).bind(
        agent_name,
        agent_account || null,
        now,
        ens_name
      ).run();
    }

    // Check if association already exists
    const existingAssociation = await db.prepare(
      'SELECT id FROM account_agents WHERE account_id = ? AND agent_id = ?'
    ).bind(account.id, agent.id).first<{ id: number }>();

    const now = Math.floor(Date.now() / 1000);

    if (existingAssociation) {
      // Update existing association
      await db.prepare(
        `UPDATE account_agents 
         SET is_primary = ?, role = ?, updated_at = ?
         WHERE account_id = ? AND agent_id = ?`
      ).bind(
        is_primary ? 1 : 0,
        role || null,
        now,
        account.id,
        agent.id
      ).run();
    } else {
      // Create new association
      await db.prepare(
        `INSERT INTO account_agents 
         (account_id, agent_id, is_primary, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        account.id,
        agent.id,
        is_primary ? 1 : 0,
        role || null,
        now,
        now
      ).run();
    }

    // If this is marked as primary, unset other primary associations for this account
    if (is_primary) {
      await db.prepare(
        `UPDATE account_agents 
         SET is_primary = 0, updated_at = ?
         WHERE account_id = ? AND agent_id != ?`
      ).bind(now, account.id, agent.id).run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[users/agents] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to associate user with agent',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

