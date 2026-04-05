import type { Metadata } from "next"
import type { Thing } from "schema-dts"
import { metadataConfig } from "~/config/metadata"
import { siteConfig } from "~/config/site"
import { getOpenGraphImageUrl, type OpenGraphParams } from "~/lib/opengraph"
import { normalizeMetaDescription } from "~/lib/meta-description"
import {
  createGraph,
  generateBreadcrumbs,
  generateWebPage,
  getOrganization,
  getWebSite,
} from "~/lib/structured-data"

type DataOptions = {
  metadata?: Metadata
  breadcrumbs?: { url: string; title: string }[]
  structuredData?: Thing[]
}

/**
 * Creates page metadata, breadcrumbs, and structured data for a page
 * @param url - The URL of the page
 * @param title - The title of the page
 * @param description - The description of the page
 * @param options - Optional metadata, breadcrumbs, and structured data
 */
export const getPageData = (
  url: string,
  title: string,
  description: string,
  options?: DataOptions,
) => {
  const metadata = { ...options?.metadata, title, description }
  const breadcrumbs = options?.breadcrumbs ?? []

  const structuredData = createGraph([
    getOrganization(),
    getWebSite(),
    generateWebPage(url, title, description),
    generateBreadcrumbs(options?.breadcrumbs ?? []),
    ...(options?.structuredData ?? []),
  ])

  return { url, metadata, breadcrumbs, structuredData }
}

type GetPageMetadataProps = {
  url: string
  ogImage?: OpenGraphParams
  metadata?: Metadata
}

/**
 * Get the metadata for a page
 * @param url - The URL of the page
 * @param title - The title of the page
 * @param description - The description of the page
 * @param metadata - The metadata for the page
 */
function metadataTitleString(title: Metadata["title"]): string {
  if (typeof title === "string") return title
  if (title && typeof title === "object" && "default" in title && title.default) {
    return String(title.default)
  }
  return siteConfig.name
}

export const getPageMetadata = ({ url, ogImage, metadata }: GetPageMetadataProps) => {
  const defaultMetadata = Object.assign({}, metadataConfig, metadata)
  const { title, description, alternates, openGraph, twitter, ...rest } = defaultMetadata

  const titleStr = metadataTitleString(title)
  const descRaw = typeof description === "string" ? description : ""
  const normalizedDescription = normalizeMetaDescription(descRaw, titleStr)

  const ogImageUrl = getOpenGraphImageUrl(
    ogImage ?? { title: titleStr, description: normalizedDescription },
  )

  return {
    title,
    description: normalizedDescription,
    alternates: { ...alternates, canonical: url },
    openGraph: {
      ...openGraph,
      title: titleStr,
      description: normalizedDescription,
      url,
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      ...twitter,
      card: "summary_large_image",
      title: titleStr,
      description: normalizedDescription,
    },
    ...rest,
  }
}
