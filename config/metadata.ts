import type { Metadata } from "next"
import { linksConfig } from "~/config/links"
import { siteConfig } from "~/config/site"
import { getOpenGraphImageUrl } from "~/lib/opengraph"

export const metadataConfig: Metadata = {
  openGraph: {
    url: "/",
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
    images: { url: getOpenGraphImageUrl({}), width: 1200, height: 630 },
  },
  twitter: {
    site: "@dirstarter",
    creator: "@piotrkulpinski",
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": linksConfig.feeds },
  },
}
