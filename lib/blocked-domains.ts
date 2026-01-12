/**
 * List of blocked domains that are not allowed for tool submissions.
 * These are temporary hosting domains that should be replaced with custom domains.
 */
export const BLOCKED_DOMAINS = [
  // Vercel
  "vercel.app",
  "vercel.dev",
  "now.sh",

  // Netlify
  "netlify.app",
  "netlify.com",

  // Heroku
  "herokuapp.com",
  "herokussl.com",

  // Cloudflare
  "pages.dev",
  "workers.dev",
  "trycloudflare.com",

  // GitHub
  "github.io",
  "github.dev",
  "githubassets.com",

  // GitLab
  "gitlab.io",

  // AWS
  "amplifyapp.com",
  "awsapprunner.com",
  "elasticbeanstalk.com",
  "cloudfront.net",
  "s3.amazonaws.com",
  "execute-api.amazonaws.com",

  // Google Cloud
  "web.app",
  "firebaseapp.com",
  "appspot.com",
  "cloudfunctions.net",
  "run.app",

  // Azure
  "azurewebsites.net",
  "azurestaticapps.net",
  "azure-api.net",
  "blob.core.windows.net",

  // Railway
  "railway.app",
  "up.railway.app",

  // Render
  "onrender.com",
  "render.com",

  // Fly.io
  "fly.dev",
  "fly.io",
  "flycast.dev",

  // Replit
  "repl.co",
  "replit.app",
  "replit.dev",

  // Glitch
  "glitch.me",

  // DigitalOcean
  "ondigitalocean.app",
  "digitaloceanspaces.com",

  // Surge
  "surge.sh",

  // Deno
  "deno.dev",

  // Ngrok
  "ngrok.io",
  "ngrok.app",
  "ngrok-free.app",

  // Codespaces
  "app.github.dev",
  "github.codespaces.com",

  // Stackblitz
  "stackblitz.io",
  "stackblitz.com",

  // Codesandbox
  "codesandbox.io",
  "csb.app",

  // Other hosting platforms
  "cyclic.app",
  "adaptable.app",
  "koyeb.app",
  "zeabur.app",
  "edgeone.app",
]

/**
 * Checks if a domain is blocked from submissions.
 * This checks if the domain ends with any of the blocked domains.
 * @param domain - The domain to check (e.g., "myapp.vercel.app" or "example.com")
 * @returns True if the domain is blocked, false otherwise
 */
export const isBlockedDomain = (domain: string): boolean => {
  if (!domain) {
    return false
  }

  const normalizedDomain = domain.toLowerCase().trim()

  return BLOCKED_DOMAINS.some(
    blockedDomain =>
      normalizedDomain === blockedDomain || normalizedDomain.endsWith(`.${blockedDomain}`),
  )
}
