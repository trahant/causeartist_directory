import { adminClient, magicLinkClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { env } from "~/env"

export const { signIn, signOut, useSession, admin } = createAuthClient({
  // Match local dev over http; https default broke session fetch when the app runs on http://localhost:3000
  baseURL: env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  plugins: [adminClient(), magicLinkClient()],
})
