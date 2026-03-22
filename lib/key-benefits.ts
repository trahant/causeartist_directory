export type KeyBenefitItem = { title: string; body: string }

/** Parse `Company.keyBenefits` / `Funder.keyBenefits` JSON from Prisma. */
export function parseKeyBenefits(raw: unknown): KeyBenefitItem[] {
  if (raw == null || !Array.isArray(raw)) return []
  const out: KeyBenefitItem[] = []
  for (const row of raw) {
    if (!row || typeof row !== "object") continue
    const title = "title" in row && typeof row.title === "string" ? row.title.trim() : ""
    const body = "body" in row && typeof row.body === "string" ? row.body.trim() : ""
    if (title || body) out.push({ title: title || "Benefit", body })
  }
  return out
}
