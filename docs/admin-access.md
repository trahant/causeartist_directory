# Admin panel access

## URL

- **Dashboard:** `/admin`
- **Blog posts:** `/admin/posts`
- **Directory profiles:** `/admin/companies`, `/admin/funders` (after implementation)

## Login

1. Open `/auth/login?next=/admin` (the `next` query returns you to admin after sign-in).
2. Sign in with **magic link** (email) and/or **Google** if `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are set in `.env`.
3. Email delivery requires your email provider env vars (e.g. Resend) to be configured like the rest of the app.

## Admin role

Only users with `role: "admin"` can access `/admin` (see `proxy.ts`).

### First admin

- **`bun prisma db seed`** creates a user with email **`admin@causeartist.com`** and role `admin` (see `prisma/seed.ts`). Use that address for the magic link, or change the seed email to match your domain.
- **Another admin** can promote any user under **Admin → Users** → row menu → **Role** → `admin`.

## Environment

- `DATABASE_URL` — required
- `ANTHROPIC_API_KEY` — optional; only for AI features in admin
- Auth/email variables as documented in your main env template
