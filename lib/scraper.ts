import { tryCatch } from "@primoui/utils"
import wretch from "wretch"
import { env } from "~/env"
import { getCache, setCache } from "~/lib/cache"

type JinaResponse = {
  data: {
    title: string
    description: string
    url: string
    content: string
  }
}

type ScrapedData = {
  title: string
  description: string
  url: string
  content: string
}

type ScrapeOptions = {
  skipCache?: boolean
}

/**
 * Generate a cache key for the scraper
 */
const getCacheKey = (url: string): string => {
  return `scraper:website:${url}`
}

/**
 * Scrapes a website and returns the scraped data using Jina.ai's Reader API.
 * Supports optional caching to reduce API calls for repeated requests.
 * @param url The URL of the website to scrape.
 * @param options Optional configuration including skipCache to bypass caching.
 * @returns The scraped data.
 */
export const scrapeWebsiteData = async (
  url: string,
  options: ScrapeOptions = {},
): Promise<ScrapedData> => {
  const { skipCache = false } = options
  const cacheKey = getCacheKey(url)

  // Check cache first (unless skipCache is true)
  if (!skipCache) {
    const cachedData = await getCache<ScrapedData>(cacheKey)

    if (cachedData) {
      return cachedData
    }
  }

  let jinaApi = wretch("https://r.jina.ai").headers({
    Accept: "application/json",
    "X-Engine": "cf-browser-rendering",
    "X-Remove-Selector": "img, video, iframe, a",
    "X-Retain-Images": "none",
    "X-Return-Format": "markdown",
  })

  if (env.JINA_API_KEY) {
    jinaApi = jinaApi.auth(`Bearer ${env.JINA_API_KEY}`)
  }

  const { data, error } = await tryCatch(jinaApi.post({ url }).json<JinaResponse>())

  if (error) {
    throw new Error(error.message)
  }

  const scrapedData = data.data

  // Cache the scraped data for future requests
  await setCache(cacheKey, scrapedData)

  return scrapedData
}
