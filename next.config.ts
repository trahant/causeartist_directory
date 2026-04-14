import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { withPlausibleProxy } from "next-plausible"
import fs from "node:fs"
import path from "node:path"

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
    /** Bounded freshness for directory totals and facet counts; pair with revalidateTag("directory-count") on writes if needed */
    directoryStats: {
      stale: 120,
      revalidate: 300,
      expire: 3600,
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
      ...(function () {
        const supabaseUrl = process.env.SUPABASE_URL
        if (!supabaseUrl) return [] as const
        try {
          return [
            {
              protocol: "https" as const,
              hostname: new URL(supabaseUrl).hostname,
              pathname: "/storage/v1/object/public/**" as const,
            },
          ]
        } catch {
          return [] as const
        }
      })(),
      ...(function () {
        const custom = process.env.SUPABASE_STORAGE_PUBLIC_URL
        if (!custom) return [] as const
        try {
          const url = new URL(custom)
          return [
            {
              protocol: "https" as const,
              hostname: url.hostname,
              port: url.port || "",
              pathname: "/**" as const,
            },
          ]
        } catch {
          return [] as const
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

  async redirects() {
    try {
      const redirectsPath = path.join(process.cwd(), "redirects.json")
      const raw = fs.readFileSync(redirectsPath, "utf-8")
      const entries: Array<{ old_url: string; new_url: string; status_code: number }> =
        JSON.parse(raw)

      return entries
        .filter(entry => entry.old_url !== "/")
        .map(entry => ({
          source: entry.old_url,
          destination: entry.new_url,
          permanent: true,
        }))
    } catch (error) {
      console.warn("Failed to load redirects.json", error)
      return []
    }
  },
}

export default withNextIntl(withPlausible(nextConfig))
