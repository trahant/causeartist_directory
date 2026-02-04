import { withContentCollections } from "@content-collections/next"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { withPlausibleProxy } from "next-plausible"

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts")
const withPlausible = withPlausibleProxy({ customDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_URL })

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

    optimizePackageImports: [
      "@content-collections/core",
      "@content-collections/mdx",
      "@content-collections/next",
    ],
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      (function () {
        const { S3_PUBLIC_URL, S3_BUCKET, S3_REGION } = process.env
        const url = new URL(S3_PUBLIC_URL ?? `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`)

        return {
          protocol: "https",
          hostname: url.hostname,
          port: "",
          pathname: "/**",
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
    ]
  },
}

export default withContentCollections(withNextIntl(withPlausible(nextConfig)))
