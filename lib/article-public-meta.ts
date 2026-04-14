import type { Metadata } from "next"
import { siteConfig } from "~/config/site"

function siteOrigin(): string {
  try {
    return new URL(siteConfig.url).origin
  } catch {
    return ""
  }
}

/** Use absolute https URL for OG/social when valid. */
export function resolveArticleOgImageUrl(
  ogImageUrl?: string | null,
  heroImageUrl?: string | null,
): string | undefined {
  for (const candidate of [ogImageUrl, heroImageUrl]) {
    if (!candidate?.trim()) continue
    const u = candidate.trim()
    if (u.startsWith("https://") || u.startsWith("http://")) return u
  }
  return undefined
}

/**
 * When set, must resolve to same-origin as `siteConfig.url`.
 * Returns an absolute URL string when override is valid; otherwise the path (e.g. `/blog/slug`).
 */
export function resolveArticleCanonicalForMetadata(
  pathUrl: string,
  canonicalOverride?: string | null,
): string {
  if (!canonicalOverride?.trim()) return pathUrl
  const raw = canonicalOverride.trim()
  try {
    const parsed = raw.startsWith("http") ? new URL(raw) : new URL(raw, siteConfig.url)
    const origin = siteOrigin()
    if (origin && parsed.origin !== origin) return pathUrl
    return parsed.toString()
  } catch {
    return pathUrl
  }
}

function parseRobotsDirectives(meta: string): { index?: boolean; follow?: boolean } | null {
  const lower = meta.toLowerCase()
  const tokens = lower.split(/[\s,]+/).filter(Boolean)
  if (!tokens.length) return null
  let index: boolean | undefined
  let follow: boolean | undefined
  for (const t of tokens) {
    if (t === "noindex") index = false
    if (t === "index") index = true
    if (t === "nofollow") follow = false
    if (t === "follow") follow = true
  }
  if (index === undefined && follow === undefined) return null
  return { index, follow }
}

export function mergeArticleRobots(options: {
  isUnpublished: boolean
  metaRobots?: string | null
}): Metadata["robots"] | undefined {
  if (options.isUnpublished) return { index: false, follow: false }
  const parsed = options.metaRobots?.trim()
    ? parseRobotsDirectives(options.metaRobots.trim())
    : null
  if (!parsed) return undefined
  return {
    ...(parsed.index !== undefined ? { index: parsed.index } : {}),
    ...(parsed.follow !== undefined ? { follow: parsed.follow } : {}),
  }
}

export function articleMetaTitle(
  seoTitle: string | null | undefined,
  displayTitle: string,
): string {
  return (seoTitle?.trim() || displayTitle).trim()
}

export function articleMetaDescription(
  seoDescription: string | null | undefined,
  excerpt: string | null | undefined,
  fallback = "",
): string {
  return (seoDescription?.trim() || excerpt?.trim() || fallback).trim()
}
