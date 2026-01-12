/**
 * Test script for URL availability validation
 *
 * This script tests the checkUrlAvailability function with various URLs
 * to ensure URL accessibility is properly detected.
 *
 * Run with: bun scripts/test-url-availability.ts
 */

import { checkUrlAvailability } from "../lib/http"

// Test cases for accessible URLs (should return true)
const accessibleTestCases = [
  { url: "https://google.com", expected: true, description: "Google homepage" },
  { url: "https://github.com", expected: true, description: "GitHub homepage" },
  { url: "https://example.com", expected: true, description: "Example.com (IANA)" },
  { url: "https://httpbin.org/status/200", expected: true, description: "HTTP 200 response" },
  { url: "https://httpbin.org/status/201", expected: true, description: "HTTP 201 response" },
  {
    url: "https://httpbin.org/status/301",
    expected: true,
    description: "HTTP 301 redirect (follows)",
  },
  {
    url: "https://httpbin.org/status/302",
    expected: true,
    description: "HTTP 302 redirect (follows)",
  },
  { url: "google.com", expected: true, description: "URL without protocol (should add https)" },
  { url: "www.google.com", expected: true, description: "URL with www but no protocol" },
]

// Test cases for inaccessible URLs (should return false)
const inaccessibleTestCases = [
  { url: "https://httpbin.org/status/404", expected: false, description: "HTTP 404 response" },
  { url: "https://httpbin.org/status/500", expected: false, description: "HTTP 500 response" },
  { url: "https://httpbin.org/status/403", expected: false, description: "HTTP 403 forbidden" },
  {
    url: "https://this-domain-definitely-does-not-exist-abc123xyz.com",
    expected: false,
    description: "Non-existent domain",
  },
  {
    url: "https://anothernonexistentdomain123456789.org",
    expected: false,
    description: "Another non-existent domain",
  },
]

// Edge cases
const edgeCases = [
  { url: "", expected: false, description: "Empty string" },
  { url: "   ", expected: false, description: "Whitespace only (may fail or return false)" },
  { url: "not-a-valid-url", expected: false, description: "Invalid URL format" },
]

async function runTests() {
  console.log("=".repeat(60))
  console.log("URL Availability Validation Tests")
  console.log("=".repeat(60))

  let passed = 0
  let failed = 0

  const allTests = [
    { name: "Accessible URLs (should return true)", tests: accessibleTestCases },
    { name: "Inaccessible URLs (should return false)", tests: inaccessibleTestCases },
    { name: "Edge Cases", tests: edgeCases },
  ]

  for (const group of allTests) {
    console.log(`\n${group.name}:`)
    console.log("-".repeat(40))

    for (const testCase of group.tests) {
      const startTime = Date.now()
      const result = await checkUrlAvailability(testCase.url)
      const duration = Date.now() - startTime
      const success = result === testCase.expected

      if (success) {
        passed++
        console.log(`✓ ${testCase.description}`)
        console.log(
          `  URL: "${testCase.url}" → ${result ? "ACCESSIBLE" : "NOT ACCESSIBLE"} (${duration}ms)`,
        )
      } else {
        failed++
        console.log(`✗ ${testCase.description}`)
        console.log(`  URL: "${testCase.url}"`)
        console.log(`  Expected: ${testCase.expected ? "ACCESSIBLE" : "NOT ACCESSIBLE"}`)
        console.log(`  Got: ${result ? "ACCESSIBLE" : "NOT ACCESSIBLE"} (${duration}ms)`)
      }

      // Warn if request took too long
      if (duration > 10000) {
        console.log(`  ⚠ WARNING: Request took ${duration}ms (exceeded 10s timeout threshold)`)
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log("=".repeat(60))

  if (failed > 0) {
    console.log(
      "\n⚠ Some tests failed. This may be due to network conditions or service availability.",
    )
    // Don't exit with error code for network-dependent tests
    // as external services may temporarily be unavailable
  }

  console.log("\n✓ URL availability tests completed!")
}

// Run timeout test separately
async function runTimeoutTest() {
  console.log(`\n${"=".repeat(60)}`)
  console.log("Timeout Test (should complete within 10s)")
  console.log("=".repeat(60))

  // Use a URL that will timeout (httpbin delay)
  const testUrl = "https://httpbin.org/delay/15" // 15 second delay
  console.log(`\nTesting timeout with: ${testUrl}`)
  console.log("Expected behavior: should return false within ~10 seconds")

  const startTime = Date.now()
  const result = await checkUrlAvailability(testUrl)
  const duration = Date.now() - startTime

  console.log(`\nResult: ${result ? "ACCESSIBLE" : "NOT ACCESSIBLE"}`)
  console.log(`Duration: ${duration}ms`)

  if (duration <= 15000 && !result) {
    console.log("✓ Timeout test passed - request was aborted within acceptable time")
  } else if (duration > 15000) {
    console.log("✗ Timeout test failed - request took too long, timeout may not be working")
  } else {
    console.log("? Unexpected result - URL returned accessible despite delay")
  }
}

async function main() {
  await runTests()

  // Ask user if they want to run the timeout test (it takes ~10-15s)
  console.log(`\n${"-".repeat(60)}`)
  console.log("Note: Timeout test (takes ~10-15 seconds) is optional.")
  console.log(
    "Run with --timeout flag to include it: bun scripts/test-url-availability.ts --timeout",
  )

  if (process.argv.includes("--timeout")) {
    await runTimeoutTest()
  }
}

main()
