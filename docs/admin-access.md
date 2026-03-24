# Admin panel access

## URL

- **Dashboard:** `/admin`
- **Blog posts:** `/admin/posts`
- **Directory profiles:** `/admin/companies`, `/admin/funders`

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

### After changing a user in Prisma Studio

If you edit **`role`**, **`email`**, or **`emailVerified`** in the database, **sign out** in the app (or use an **incognito** window) and complete magic link again so the session reflects the updated `User` row.

The email you type on the login form must match the **`User.email`** row that has **`role = admin`**.

## Environment

- `DATABASE_URL` — required
- `BETTER_AUTH_SECRET` — required
- `BETTER_AUTH_URL` — must match the site origin you open in the browser (scheme + host + port), e.g. `http://localhost:3000` for local dev on port 3000
- `NEXT_PUBLIC_SITE_URL` — should match **`BETTER_AUTH_URL`** so the browser auth client calls the same origin as the server-generated magic links
- `ANTHROPIC_API_KEY` — optional; only for AI features in admin
- Resend vars — see “Magic link email” above

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| Redirected to `/` from `/admin` | Your session user’s **`role`** is not **`admin`** in the `User` table, or you are not signed in. |
| `?error=ATTEMPTS_EXCEEDED` on the home page (or a banner) | Too many magic-link tries, an **old link**, or your **email provider “link scan”** consumed the token. **Request one new link**, paste it in a **private/incognito** window, and click it **once**. |
| Magic link never arrives | Set **`RESEND_API_KEY`** + **`RESEND_SENDER_EMAIL`**, or use the **terminal-printed URL** in dev. |
| Auth works but API seems wrong | **`NEXT_PUBLIC_SITE_URL`** and **`BETTER_AUTH_URL`** must match how you open the site (e.g. not `https` in env if you use `http://localhost:3000`). |
| Stuck after editing user in Studio | **Sign out** or new **incognito** session, then magic link again. |

## Verification

1. `.env.local`: `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` match your browser URL.
2. DB: `User` row with your email, `role = admin`, `emailVerified = true` recommended.
3. Visit `/auth/login?next=/admin` → complete magic link → `/admin` loads.
