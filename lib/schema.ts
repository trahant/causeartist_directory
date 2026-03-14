import type { CompanyOne } from "~/server/web/companies/payloads"
import type { FunderOne } from "~/server/web/funders/payloads"
import { siteConfig } from "~/config/site"

const toAbsoluteUrl = (path: string): string => {
  return path.startsWith("http") ? path : `${siteConfig.url}${path}`
}

/**
 * Company JSON-LD: Organization + FAQPage
 */
export function generateCompanySchema(
  company: CompanyOne,
): Array<{ "@context": string; "@type": string; [key: string]: unknown }> {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: company.website ?? undefined,
    description: company.description ?? undefined,
    foundingDate: company.foundedYear?.toString(),
    knowsAbout: company.sectors.map(s => s.sector.name),
    sameAs: [company.linkedin].filter(Boolean) as string[],
  }

  const firstLocationName = company.locations[0]?.location?.name ?? "Global"
  const firstSectorName = company.sectors[0]?.sector?.name ?? "Impact"
  const faqAnswer1 = company.tagline ?? company.description ?? ""

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What does ${company.name} do?`,
        acceptedAnswer: { "@type": "Answer", text: faqAnswer1 },
      },
      {
        "@type": "Question",
        name: `Where is ${company.name} based?`,
        acceptedAnswer: { "@type": "Answer", text: firstLocationName },
      },
      {
        "@type": "Question",
        name: `What sector does ${company.name} operate in?`,
        acceptedAnswer: { "@type": "Answer", text: firstSectorName },
      },
    ],
  }

  return [organization, faqPage]
}

/**
 * Funder JSON-LD: Organization (with aum, investmentThesis in description) + FAQPage
 */
export function generateFunderSchema(
  funder: FunderOne,
): Array<{ "@context": string; "@type": string; [key: string]: unknown }> {
  const descriptionParts = [funder.description]
  if (funder.aum) descriptionParts.push(`AUM: ${funder.aum}`)
  if (funder.investmentThesis) descriptionParts.push(funder.investmentThesis)
  const description = descriptionParts.filter(Boolean).join(" ") || undefined

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: funder.name,
    url: funder.website ?? undefined,
    description,
    foundingDate: funder.foundedYear?.toString(),
    knowsAbout: funder.sectors.map(s => s.sector.name),
    sameAs: [funder.linkedin].filter(Boolean) as string[],
  }

  const checkSizeText =
    funder.checkSizeMin != null && funder.checkSizeMax != null
      ? `$${funder.checkSizeMin.toLocaleString()} - $${funder.checkSizeMax.toLocaleString()}`
      : funder.checkSizeMin != null
        ? `From $${funder.checkSizeMin.toLocaleString()}`
        : funder.checkSizeMax != null
          ? `Up to $${funder.checkSizeMax.toLocaleString()}`
          : "Varies"
  const thesisAnswer = funder.investmentThesis ?? funder.description ?? ""

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What does ${funder.name} fund?`,
        acceptedAnswer: { "@type": "Answer", text: funder.description ?? thesisAnswer },
      },
      {
        "@type": "Question",
        name: `What is ${funder.name}'s check size?`,
        acceptedAnswer: { "@type": "Answer", text: checkSizeText },
      },
      {
        "@type": "Question",
        name: `What is ${funder.name}'s investment thesis?`,
        acceptedAnswer: { "@type": "Answer", text: thesisAnswer },
      },
    ],
  }

  return [organization, faqPage]
}

/**
 * Article JSON-LD
 */
export function generateArticleSchema(post: {
  title: string
  excerpt?: string | null
  publishedAt?: Date | null
  slug: string
}): { "@context": string; "@type": string; [key: string]: unknown } {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt?.toISOString(),
    url: toAbsoluteUrl(`/blog/${post.slug}`),
  }
}

/**
 * PodcastEpisode JSON-LD
 */
export function generatePodcastSchema(episode: {
  title: string
  description?: string | null
  publishedAt?: Date | null
  spotifyUrl?: string | null
  slug: string
}): { "@context": string; "@type": string; [key: string]: unknown } {
  const url = toAbsoluteUrl(`/podcast/${episode.slug}`)
  return {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    description: episode.description ?? undefined,
    datePublished: episode.publishedAt?.toISOString(),
    url,
    ...(episode.spotifyUrl && {
      associatedMedia: {
        "@type": "MediaObject",
        contentUrl: episode.spotifyUrl,
      },
    }),
  }
}
