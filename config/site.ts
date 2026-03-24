import { getDomain } from "@primoui/utils"
import { env } from "~/env"

// Align with auth client / Better Auth defaults for local dev (http, not https)
const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const siteConfig = {
  name: "Causeartist",
  slug: "causeartist",
  email: env.NEXT_PUBLIC_SITE_EMAIL,
  url: siteUrl,
  domain: getDomain(siteUrl),
  currency: "usd",
}
