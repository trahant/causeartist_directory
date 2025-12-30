import { withContentCollections } from "@content-collections/next"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { withPlausibleProxy } from "next-plausible"

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts")
const withPlausible = withPlausibleProxy({ customDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_URL })

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactStrictMode: false,

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

    optimizePackageImports: [
      "@content-collections/core",
      "@content-collections/mdx",
      "@content-collections/next",
    ],
  },

  async rewrites() {
    return [
      {
        source: "/sitemap/:id.xml",
        destination: "/sitemap/:id",
      },
    ]
  },
}

export default withContentCollections(withNextIntl(withPlausible(nextConfig)))
