import type { MetadataRoute } from "next"
import { siteConfig } from "~/config/site"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin*", "/auth*", "/dashboard*", "/api/"],
      },
      {
        userAgent: "Googlebot",
        disallow: "/*/opengraph-image-",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
