import { getDomain } from "@primoui/utils"
import { env } from "~/env"

const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000"

export const siteConfig = {
  name: "Causeartist",
  slug: "causeartist",
  email: env.NEXT_PUBLIC_SITE_EMAIL,
  url: siteUrl,
  domain: getDomain(siteUrl),
  currency: "usd",
}
