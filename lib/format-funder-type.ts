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
