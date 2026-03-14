#!/usr/bin/env node
/**
 * Build-time check: ensure DATABASE_URL is the Supabase Session pooler URL.
 * P1000 often happens when the direct URL (user "postgres") is used instead of
 * the pooler URL (user "postgres.PROJECT_REF").
 */
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('\n[check-db-url] DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables.\n');
  process.exit(1);
}

try {
  const parsed = new URL(url);
  const user = parsed.username;
  const host = parsed.hostname;

  if (user === 'postgres' && !host.includes('pooler')) {
    console.error(`
[check-db-url] Wrong connection string format.

You are using the DIRECT connection (user "postgres", host "${host}").
Vercel needs the SESSION POOLER URL.

In Supabase: Settings → Database → Connection string → "Session pooler" tab.
Use the URI that looks like:
  postgresql://postgres.XXXXXXXXXX:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
(Username must be postgres.YOUR_PROJECT_REF, host must be ...pooler.supabase.com)

Set that exact value as DATABASE_URL in Vercel, then redeploy (without build cache).
`);
    process.exit(1);
  }

  if (!host.includes('pooler.supabase.com')) {
    console.warn('[check-db-url] Warning: host is not Supabase pooler (*.pooler.supabase.com). You may get P1000 on Vercel.');
  }

  console.log('[check-db-url] DATABASE_URL looks like Session pooler (user:', user + ').');
} catch (e) {
  console.error('[check-db-url] DATABASE_URL is not a valid URL:', e.message);
  process.exit(1);
}
