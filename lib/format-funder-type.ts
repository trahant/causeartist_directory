const FUNDER_TYPE_SLUGS = [
  "vc",
  "foundation",
  "accelerator",
  "family-office",
  "cdfi",
  "impact-fund",
  "fellowship",
  "corporate",
] as const

export type FunderTypeSlug = (typeof FUNDER_TYPE_SLUGS)[number]

export function isFunderTypeSlug(type: string | null | undefined): type is FunderTypeSlug {
  return type != null && type !== "" && (FUNDER_TYPE_SLUGS as readonly string[]).includes(type)
}

export function formatFunderType(type: string | null): string {
  switch (type) {
    case "vc":
      return "Venture Capital"
    case "foundation":
      return "Foundation"
    case "accelerator":
      return "Accelerator"
    case "family-office":
      return "Family Office"
    case "cdfi":
      return "CDFI"
    case "impact-fund":
      return "Impact Fund"
    case "fellowship":
      return "Fellowship"
    case "corporate":
      return "Corporate"
    default:
      return "Impact Fund"
  }
}
