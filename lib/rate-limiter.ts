import { tryCatch } from "@primoui/utils"
import { headers } from "next/headers"
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible"
import { rateLimitConfig } from "~/config/rate-limit"
import { redis } from "~/services/redis"

export type RateLimitAction = keyof typeof rateLimitConfig.actions

const createLimiter = (action: RateLimitAction) => {
  const config = { keyPrefix: `rl:${action}`, ...rateLimitConfig.actions[action] }
  const limiter = new RateLimiterMemory(config)

  if (redis) {
    return new RateLimiterRedis({
      storeClient: redis,
      insuranceLimiter: limiter, // Fallback if Redis fails
      ...config,
    })
  }

  return limiter
}

const limiters = {
  submission: createLimiter("submission"),
  report: createLimiter("report"),
  newsletter: createLimiter("newsletter"),
  claim: createLimiter("claim"),
  media: createLimiter("media"),
}

/**
 * Get the IP address of the client
 * @returns IP address
 */
const getIP = async () => {
  const FALLBACK_IP_ADDRESS = "0.0.0.0"
  const headersList = await headers()
  const forwardedFor = headersList.get("x-forwarded-for")

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS
  }

  return headersList.get("x-real-ip") ?? FALLBACK_IP_ADDRESS
}

/**
 * Check if the user is rate limited
 * @param action - The rate limiter action to use
 * @param keyPrefix - Optional key prefix (defaults to action name)
 * @param identifier - Optional identifier (defaults to IP address)
 * @returns True if the user is rate limited, false otherwise
 */
export const isRateLimited = async (
  action: RateLimitAction,
  keyPrefix?: string,
  identifier?: string,
): Promise<boolean> => {
  const id = identifier ?? (await getIP())
  const key = keyPrefix ? `${keyPrefix}:${id}` : id

  const { error } = await tryCatch(limiters[action].consume(key))

  if (error) {
    // RateLimiterRes is thrown when rate limited (has remainingPoints property)
    if ("remainingPoints" in error) {
      return true
    }

    console.error("Rate limiter error:", error)
    return false // Fail open to prevent blocking legitimate users
  }

  return false
}
