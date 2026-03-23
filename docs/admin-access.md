# Admin panel access

## URL

- **Dashboard:** `/admin`
- **Blog posts:** `/admin/posts`
- **Directory profiles:** `/admin/companies`, `/admin/funders` (after implementation)

## Login

1. Open `/auth/login?next=/admin` (the `next` query returns you to admin after sign-in).
2. Sign in with **magic link** (email only).

### Magic link email

- **Real inbox:** Set **`RESEND_API_KEY`** and **`RESEND_SENDER_EMAIL`** in `.env.local` (verified sender/domain in [Resend](https://resend.com)). Emails send in **development and production** once both are set.
- **Local dev without Resend:** After you submit your email, check the **terminal where `bun run dev` is running** — the sign-in URL is printed there so you can paste it into the browser.

## Admin role

Only users with `role: "admin"` can access `/admin` (see `proxy.ts`).

### First admin

- **`bun prisma db seed`** creates a user with email **`admin@causeartist.com`** and role `admin` (see `prisma/seed.ts`). Use that address for the magic link, or change the seed email to match your domain.
- **Another admin** can promote any user under **Admin → Users** → row menu → **Role** → `admin`.

## Environment

- `DATABASE_URL` — required
- `ANTHROPIC_API_KEY` — optional; only for AI features in admin
- Auth/email variables as documented in your main env template
