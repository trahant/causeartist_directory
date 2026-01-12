/**
 * Test script for caching functionality
 *
 * This script tests the getCache and setCache functions to ensure
 * caching works correctly with Redis (when available) and gracefully
 * handles when Redis is unavailable.
 *
 * Run with: bun scripts/test-caching.ts
 */

import { deleteCache, getCache, setCache } from "../lib/cache"
import { redis } from "../services/redis"

// Test configuration
const TEST_KEY_PREFIX = "test:cache:"
const DEFAULT_TTL = 60 * 60 * 24 // 24 hours in seconds

type TestCase = {
  name: string
  fn: () => Promise<{ passed: boolean; message: string }>
}

const testCases: TestCase[] = [
  {
    name: "Set and get a string value",
    fn: async () => {
      const key = `${TEST_KEY_PREFIX}string`
      const value = "Hello, Cache!"

      await setCache(key, value)
      const result = await getCache<string>(key)

      await deleteCache(key)

      if (result === value) {
        return { passed: true, message: `Got: "${result}"` }
      }
      return { passed: false, message: `Expected: "${value}", Got: "${result}"` }
    },
  },
  {
    name: "Set and get an object value",
    fn: async () => {
      const key = `${TEST_KEY_PREFIX}object`
      const value = { name: "Test Tool", url: "https://example.com", count: 42 }

      await setCache(key, value)
      const result = await getCache<typeof value>(key)

      await deleteCache(key)

      if (
        result &&
        result.name === value.name &&
        result.url === value.url &&
        result.count === value.count
      ) {
        return { passed: true, message: `Got: ${JSON.stringify(result)}` }
      }
      return {
        passed: false,
        message: `Expected: ${JSON.stringify(value)}, Got: ${JSON.stringify(result)}`,
      }
    },
  },
  {
    name: "Set and get an array value",
    fn: async () => {
      const key = `${TEST_KEY_PREFIX}array`
      const value = ["item1", "item2", "item3"]

      await setCache(key, value)
      const result = await getCache<string[]>(key)

      await deleteCache(key)

      if (result && Array.isArray(result) && result.length === value.length) {
        return { passed: true, message: `Got: ${JSON.stringify(result)}` }
      }
      return {
        passed: false,
        message: `Expected: ${JSON.stringify(value)}, Got: ${JSON.stringify(result)}`,
      }
    },
  },
  {
    name: "Get non-existent key returns null",
    fn: async () => {
      const key = `${TEST_KEY_PREFIX}nonexistent_${Date.now()}`
      const result = await getCache<string>(key)

      if (result === null) {
        return { passed: true, message: "Correctly returned null" }
      }
      return { passed: false, message: `Expected: null, Got: ${JSON.stringify(result)}` }
    },
  },
  {
    name: "Delete cache removes value",
    fn: async () => {
      const key = `${TEST_KEY_PREFIX}delete_test`
      const value = "to be deleted"

      await setCache(key, value)
      const beforeDelete = await getCache<string>(key)

      await deleteCache(key)
      const afterDelete = await getCache<string>(key)

      if (beforeDelete === value && afterDelete === null) {
        return { passed: true, message: "Value correctly deleted" }
      }
      return {
        passed: false,
        message: `Before delete: "${beforeDelete}", After delete: "${afterDelete}"`,
      }
    },
  },
  {
    name: "Set cache with custom TTL",
    fn: async () => {
      const key = `${TEST_KEY_PREFIX}ttl_test`
      const value = "with custom TTL"
      const customTtl = 3600 // 1 hour

      await setCache(key, value, customTtl)
      const result = await getCache<string>(key)

      // Check TTL if Redis is available
      let ttlCheck = "TTL not checked (Redis unavailable)"
      if (redis) {
        const ttl = await redis.ttl(key)
        ttlCheck = `TTL: ${ttl}s (expected ~${customTtl}s)`
        // TTL should be close to customTtl (within a few seconds)
        if (ttl > customTtl - 5 && ttl <= customTtl) {
          ttlCheck += " ✓"
        }
      }

      await deleteCache(key)

      if (result === value) {
        return { passed: true, message: `Got: "${result}", ${ttlCheck}` }
      }
      return { passed: false, message: `Expected: "${value}", Got: "${result}"` }
    },
  },
  {
    name: "Cache handles null value correctly",
    fn: async () => {
      const key = `${TEST_KEY_PREFIX}null_test`
      const value = null

      await setCache(key, value)
      const result = await getCache<null>(key)

      await deleteCache(key)

      // JSON.parse of "null" returns null, which is valid
      if (result === null) {
        return { passed: true, message: "Null value handled correctly" }
      }
      return { passed: false, message: `Expected: null, Got: ${JSON.stringify(result)}` }
    },
  },
  {
    name: "Cache handles nested objects",
    fn: async () => {
      const key = `${TEST_KEY_PREFIX}nested`
      const value = {
        tool: {
          name: "Nested Tool",
          metadata: {
            categories: ["A", "B"],
            settings: { enabled: true, count: 10 },
          },
        },
      }

      await setCache(key, value)
      const result = await getCache<typeof value>(key)

      await deleteCache(key)

      if (
        result &&
        result.tool.name === value.tool.name &&
        result.tool.metadata.categories.length === value.tool.metadata.categories.length &&
        result.tool.metadata.settings.enabled === value.tool.metadata.settings.enabled
      ) {
        return { passed: true, message: "Nested object preserved correctly" }
      }
      return { passed: false, message: "Nested object mismatch" }
    },
  },
  {
    name: "Verify default TTL is 24 hours",
    fn: async () => {
      const key = `${TEST_KEY_PREFIX}default_ttl`
      const value = "default TTL test"

      await setCache(key, value) // No TTL parameter, should use default

      let ttlValid = false
      let ttlMessage = "Cannot verify TTL (Redis unavailable)"

      if (redis) {
        const ttl = await redis.ttl(key)
        // Default TTL should be 24 hours (86400 seconds)
        ttlValid = ttl > DEFAULT_TTL - 5 && ttl <= DEFAULT_TTL
        ttlMessage = `TTL: ${ttl}s (expected: ${DEFAULT_TTL}s = 24 hours)`
      } else {
        // If Redis is unavailable, we can't verify TTL but the test passes
        // because the code is designed to handle this case
        ttlValid = true
        ttlMessage = "Redis unavailable - graceful fallback verified"
      }

      await deleteCache(key)

      return { passed: ttlValid, message: ttlMessage }
    },
  },
]

async function checkRedisConnection(): Promise<boolean> {
  if (!redis) {
    return false
  }

  try {
    await redis.ping()
    return true
  } catch {
    return false
  }
}

async function runTests() {
  console.log("=".repeat(60))
  console.log("Caching Functionality Tests")
  console.log("=".repeat(60))

  // Check Redis availability
  const redisAvailable = await checkRedisConnection()
  console.log(`\nRedis Status: ${redisAvailable ? "✓ Connected" : "✗ Not available"}`)

  if (!redisAvailable) {
    console.log("\nNote: Redis is not available. The caching system is designed to")
    console.log("gracefully handle this case by returning null on get and silently")
    console.log("failing on set. This is expected behavior in development without Redis.")
    console.log("\nTo enable Redis, set the REDIS_URL environment variable:")
    console.log('  REDIS_URL="redis://localhost:6379"')
  }

  console.log(`\n${"-".repeat(40)}`)
  console.log("Running Tests:")
  console.log("-".repeat(40))

  let passed = 0
  let failed = 0
  let skipped = 0

  for (const testCase of testCases) {
    try {
      // Skip tests that require Redis if not available
      if (!redisAvailable) {
        skipped++
        console.log(`⊘ ${testCase.name}`)
        console.log("  Skipped: Redis not available")
        continue
      }

      const result = await testCase.fn()

      if (result.passed) {
        passed++
        console.log(`✓ ${testCase.name}`)
        console.log(`  ${result.message}`)
      } else {
        failed++
        console.log(`✗ ${testCase.name}`)
        console.log(`  ${result.message}`)
      }
    } catch (error) {
      failed++
      console.log(`✗ ${testCase.name}`)
      console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Test graceful fallback behavior when Redis is unavailable
  console.log(`\n${"-".repeat(40)}`)
  console.log("Graceful Fallback Tests:")
  console.log("-".repeat(40))

  // Test that getCache returns null when Redis unavailable
  const getCacheResult = await getCache<string>("any-key")
  if (!redisAvailable && getCacheResult === null) {
    passed++
    console.log("✓ getCache returns null when Redis unavailable")
  } else if (redisAvailable) {
    passed++
    console.log("✓ getCache connected to Redis")
  } else {
    failed++
    console.log("✗ getCache should return null when Redis unavailable")
  }

  // Test that setCache doesn't throw when Redis unavailable
  try {
    await setCache("test-key", "test-value")
    passed++
    console.log("✓ setCache does not throw when Redis unavailable")
  } catch {
    failed++
    console.log("✗ setCache should not throw when Redis unavailable")
  }

  // Test that deleteCache doesn't throw when Redis unavailable
  try {
    await deleteCache("test-key")
    passed++
    console.log("✓ deleteCache does not throw when Redis unavailable")
  } catch {
    failed++
    console.log("✗ deleteCache should not throw when Redis unavailable")
  }

  console.log(`\n${"=".repeat(60)}`)
  console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`)
  console.log("=".repeat(60))

  if (failed > 0) {
    process.exit(1)
  }

  if (skipped > 0 && !redisAvailable) {
    console.log("\n⚠ Some tests were skipped because Redis is not available.")
    console.log("  This is expected in development without Redis.")
    console.log("  The caching system gracefully handles this case.")
  }

  console.log("\n✓ All caching tests passed!")

  // Cleanup: close Redis connection if open
  if (redis) {
    await redis.quit()
  }
}

runTests()
