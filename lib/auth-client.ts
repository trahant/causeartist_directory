import { adminClient, magicLinkClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { env, isDev } from "~/env"

const fallbackBaseURL =
  typeof window === "undefined" ? "http://localhost:3000" : window.location.origin

if (isDev && typeof window !== "undefined" && env.NEXT_PUBLIC_SITE_URL) {
  const configuredOrigin = new URL(env.NEXT_PUBLIC_SITE_URL).origin
  const currentOrigin = window.location.origin

  if (configuredOrigin !== currentOrigin) {
    console.warn(
      `[auth] NEXT_PUBLIC_SITE_URL (${configuredOrigin}) does not match current origin (${currentOrigin}). This can cause magic-link "Failed to fetch" errors. Update NEXT_PUBLIC_SITE_URL and BETTER_AUTH_URL to match the URL you open in the browser.`,
    )
  }
}

export const { signIn, signOut, useSession, admin } = createAuthClient({
  // Prefer explicit env, but gracefully fall back to the actual browser origin to avoid cross-origin fetch errors.
  baseURL: env.NEXT_PUBLIC_SITE_URL ?? fallbackBaseURL,
  plugins: [adminClient(), magicLinkClient()],
})
