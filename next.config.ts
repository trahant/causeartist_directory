import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { withPlausibleProxy } from "next-plausible"

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts")
const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_URL
const withPlausible = plausibleDomain
  ? withPlausibleProxy({ customDomain: plausibleDomain })
  : (config: NextConfig) => config

const nextConfig: NextConfig = {
  typedRoutes: true,

  cacheLife: {
    infinite: {
      stale: Number.POSITIVE_INFINITY,
      revalidate: Number.POSITIVE_INFINITY,
      expire: Number.POSITIVE_INFINITY,
    },
  },

  experimental: {
    useCache: true,
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      (function () {
        const { S3_PUBLIC_URL, S3_BUCKET, S3_REGION } = process.env
        if (!S3_BUCKET || !S3_REGION) {
          return { protocol: "https" as const, hostname: "localhost", port: "", pathname: "/**" }
        }
        try {
          const url = new URL(S3_PUBLIC_URL ?? `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`)
          return { protocol: "https" as const, hostname: url.hostname, port: "", pathname: "/**" }
        } catch {
          return { protocol: "https" as const, hostname: "localhost", port: "", pathname: "/**" }
        }
      })(),
    ],
  },

  async rewrites() {
    return [
      {
        source: "/sitemap/:id.xml",
        destination: "/sitemap/:id",
      },
      {
        source: "/rss.xml",
        destination: "/rss/tools.xml",
      },
      {
        source: "/api/cron/publish-tools",
        destination: "/api/cron/publish",
      },
    ]
  },
}

export default withNextIntl(withPlausible(nextConfig))
