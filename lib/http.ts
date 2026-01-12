/**
 * Default timeout for HTTP requests in milliseconds (10 seconds)
 */
const DEFAULT_TIMEOUT = 10_000

/**
 * User-Agent string for HTTP requests to avoid being blocked
 */
const USER_AGENT = "Mozilla/5.0 (compatible; DirStarter/1.0; +https://dirstarter.com)"

/**
 * Checks if a URL is accessible by making an HTTP request.
 * First tries a HEAD request, then falls back to GET if HEAD fails.
 * @param url - The URL to check
 * @returns True if the URL is accessible (status < 400), false otherwise
 */
export const checkUrlAvailability = async (url: string): Promise<boolean> => {
  if (!url) {
    return false
  }

  try {
    // Normalize URL
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

    try {
      // First try HEAD request (lighter weight)
      const headResponse = await fetch(normalizedUrl, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": USER_AGENT,
        },
      })

      clearTimeout(timeoutId)
      return headResponse.status < 400
    } catch {
      // HEAD request failed, try GET as fallback
      // Some servers don't support HEAD requests
      clearTimeout(timeoutId)

      const getController = new AbortController()
      const getTimeoutId = setTimeout(() => getController.abort(), DEFAULT_TIMEOUT)

      try {
        const getResponse = await fetch(normalizedUrl, {
          method: "GET",
          signal: getController.signal,
          redirect: "follow",
          headers: {
            "User-Agent": USER_AGENT,
          },
        })

        clearTimeout(getTimeoutId)
        return getResponse.status < 400
      } catch {
        clearTimeout(getTimeoutId)
        return false
      }
    }
  } catch {
    // Handle any unexpected errors
    return false
  }
}
