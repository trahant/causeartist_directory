/**
 * Test script for domain blocking validation
 *
 * This script tests the isBlockedDomain function with various domains
 * to ensure blocked domains are properly detected.
 *
 * Run with: bun scripts/test-domain-blocking.ts
 */

import { BLOCKED_DOMAINS, isBlockedDomain } from "../lib/blocked-domains"

// Test cases for blocked domains
const blockedTestCases = [
  // Vercel
  { domain: "myapp.vercel.app", expected: true, description: "Subdomain of vercel.app" },
  { domain: "vercel.app", expected: true, description: "Direct vercel.app" },
  { domain: "test-app.vercel.dev", expected: true, description: "Subdomain of vercel.dev" },

  // Netlify
  { domain: "mysite.netlify.app", expected: true, description: "Subdomain of netlify.app" },
  { domain: "netlify.app", expected: true, description: "Direct netlify.app" },

  // GitHub Pages
  { domain: "username.github.io", expected: true, description: "GitHub Pages domain" },
  { domain: "github.io", expected: true, description: "Direct github.io" },

  // Heroku
  { domain: "myapp.herokuapp.com", expected: true, description: "Heroku app" },

  // Cloudflare
  { domain: "mysite.pages.dev", expected: true, description: "Cloudflare Pages" },
  { domain: "myworker.workers.dev", expected: true, description: "Cloudflare Workers" },

  // Railway
  { domain: "myapp.railway.app", expected: true, description: "Railway app" },

  // Render
  { domain: "myservice.onrender.com", expected: true, description: "Render service" },

  // Firebase/Google Cloud
  { domain: "myapp.web.app", expected: true, description: "Firebase Hosting" },
  { domain: "myapp.firebaseapp.com", expected: true, description: "Firebase legacy" },
  { domain: "myapp.run.app", expected: true, description: "Cloud Run" },

  // Azure
  { domain: "mysite.azurewebsites.net", expected: true, description: "Azure Web Apps" },

  // AWS
  { domain: "myapp.amplifyapp.com", expected: true, description: "AWS Amplify" },

  // Ngrok
  { domain: "abc123.ngrok.io", expected: true, description: "Ngrok tunnel" },
  { domain: "xyz.ngrok-free.app", expected: true, description: "Ngrok free app" },
]

// Test cases for allowed domains (should NOT be blocked)
const allowedTestCases = [
  { domain: "example.com", expected: false, description: "Regular custom domain" },
  { domain: "mycompany.io", expected: false, description: "Custom .io domain" },
  { domain: "app.mycompany.com", expected: false, description: "Subdomain of custom domain" },
  {
    domain: "vercelapp.com",
    expected: false,
    description: "Similar but not blocked (vercelapp vs vercel.app)",
  },
  {
    domain: "notvercel.app",
    expected: false,
    description: "Domain ending in .app but not blocked",
  },
  { domain: "mynetlify.com", expected: false, description: "Contains 'netlify' but different TLD" },
  { domain: "netlifyapp.io", expected: false, description: "Similar to netlify.app but different" },
  { domain: "github.com", expected: false, description: "GitHub main site (not github.io)" },
  { domain: "dev.to", expected: false, description: "Dev.to (not pages.dev)" },
  { domain: "railway.com", expected: false, description: "Different from railway.app" },
  { domain: "subdomain.example.com", expected: false, description: "Deep subdomain" },
]

// Edge cases
const edgeCases = [
  { domain: "", expected: false, description: "Empty string" },
  { domain: "  ", expected: false, description: "Whitespace only" },
  { domain: "VERCEL.APP", expected: true, description: "Uppercase (should normalize)" },
  { domain: "  vercel.app  ", expected: true, description: "With whitespace (should trim)" },
  { domain: "MyApp.Vercel.App", expected: true, description: "Mixed case" },
]

function runTests() {
  console.log("=".repeat(60))
  console.log("Domain Blocking Validation Tests")
  console.log("=".repeat(60))

  let passed = 0
  let failed = 0

  const allTests = [
    { name: "Blocked Domains", tests: blockedTestCases },
    { name: "Allowed Domains", tests: allowedTestCases },
    { name: "Edge Cases", tests: edgeCases },
  ]

  for (const group of allTests) {
    console.log(`\n${group.name}:`)
    console.log("-".repeat(40))

    for (const testCase of group.tests) {
      const result = isBlockedDomain(testCase.domain)
      const success = result === testCase.expected

      if (success) {
        passed++
        console.log(`✓ ${testCase.description}`)
        console.log(`  Domain: "${testCase.domain}" → ${result ? "BLOCKED" : "ALLOWED"}`)
      } else {
        failed++
        console.log(`✗ ${testCase.description}`)
        console.log(`  Domain: "${testCase.domain}"`)
        console.log(`  Expected: ${testCase.expected ? "BLOCKED" : "ALLOWED"}`)
        console.log(`  Got: ${result ? "BLOCKED" : "ALLOWED"}`)
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log("=".repeat(60))

  console.log(`\nTotal blocked domains configured: ${BLOCKED_DOMAINS.length}`)

  if (failed > 0) {
    process.exit(1)
  }

  console.log("\n✓ All domain blocking tests passed!")
}

runTests()
