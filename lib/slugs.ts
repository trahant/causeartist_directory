import { slugify } from "@primoui/utils"

/**
 * Generates a unique slug by checking for collisions and appending a suffix if necessary.
 */
export const generateUniqueSlug = async (
  source: string,
  slugExists: (slug: string) => Promise<boolean>,
  currentSlug?: string,
  maxAttempts = 20,
): Promise<string> => {
  const baseSlug = slugify(source)

  // If the generated slug matches the existing one, no changes are needed
  if (currentSlug === baseSlug) {
    return baseSlug
  }

  // Check if the base slug is available
  if (!(await slugExists(baseSlug))) {
    return baseSlug
  }

  // Try appending suffixes (e.g., -2, -3) up to a limit
  let suffix = 2

  while (suffix <= maxAttempts) {
    const candidate = `${baseSlug}-${suffix}`

    if (!(await slugExists(candidate))) {
      return candidate
    }

    suffix++
  }

  throw new Error(`Failed to generate unique slug for "${source}".`)
}
