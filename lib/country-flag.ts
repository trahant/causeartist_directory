/** Fixed height on flagcdn (~2× typical 12px CSS height for sharp retina rendering). */
const FLAGCDN_BASE = "https://flagcdn.com/h24"

/**
 * PNG URL on flagcdn (lowercase ISO 3166-1 alpha-2). Returns null if code missing/invalid.
 */
export function flagUrlFromCountryCode(code: string | null | undefined): string | null {
  if (code == null || typeof code !== "string") return null
  const c = code.trim().toLowerCase()
  if (c.length !== 2 || !/^[a-z]{2}$/.test(c)) return null
  return `${FLAGCDN_BASE}/${c}.png`
}
