# Vercel deployment – Causeartist Directory

**Production app URL:**  
https://causeartist-directory-git-main-trahants-projects.vercel.app

## Environment variables (Vercel)

**Only `DATABASE_URL` is required for the build to succeed.** All other env vars have defaults or are optional; the app will run with fallbacks (e.g. auth and site URL default to localhost) until you set production values.

In **Vercel → Project → Settings → Environment Variables**, set at least:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | **Session pooler** URI only (see below). **Required** for install and build. |

### Fixing P1000 "Authentication failed" / "credentials for postgres are not valid"

Use the **Session pooler** URL, not the direct connection URL.

- **Correct (Session pooler):** username is `postgres.YOUR_PROJECT_REF`, host is `aws-0-...pooler.supabase.com`, port `5432`.
  - Example shape: `postgresql://postgres.XXXXXXXXXX:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
- **Wrong (Direct):** username is `postgres`, host is `db.XXXXXXXXXX.supabase.co` — often fails from Vercel (auth or IP).

In Supabase: **Project → Settings → Database → Connection string** → choose **"Session pooler"** (or "Connection pooling" → Session mode), copy the URI, replace `[YOUR-PASSWORD]` with your database password, and paste that **exact** value into Vercel’s `DATABASE_URL` (no extra spaces or line breaks).

**Recommended for production:** Set these so auth and links work correctly:

| Variable | Example / description |
|----------|------------------------|
| `NEXT_PUBLIC_SITE_URL` | `https://causeartist-directory-git-main-trahants-projects.vercel.app` |
| `BETTER_AUTH_URL` | Same as `NEXT_PUBLIC_SITE_URL` |
| `BETTER_AUTH_SECRET` | From `openssl rand -base64 32` (if unset, a default is used and auth may be insecure) |

Add any other vars your app needs (e.g. `CRON_SECRET`, OAuth keys, Stripe, etc.) from `.env.example`.

## Build

- **Install:** Runs `npm install`. Postinstall runs `prisma generate` only when `DATABASE_URL` is set (no Bun required).
- **Build:** `prisma migrate deploy && next build`

If the build fails on install, confirm `DATABASE_URL` is set in Vercel and that the value is correct (no extra spaces, valid URL).

After changing any environment variable in Vercel, trigger a new deployment (Redeploy or push a commit) so the build uses the updated values.
