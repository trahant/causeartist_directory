export function formatFunderCheckSize(min: number | null, max: number | null): string | null {
  if (min != null && max != null) {
    return `$${min.toLocaleString()} – $${max.toLocaleString()}`
  }
  if (min != null) return `From $${min.toLocaleString()}`
  if (max != null) return `Up to $${max.toLocaleString()}`
  return null
}
