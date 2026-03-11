import { Geist } from "next/font/google"
import type { Font, FontWeight } from "satori"

export const fontSans = Geist({
  variable: "--font-sans",
  display: "swap",
  subsets: ["latin"],
  weight: "variable",
})

export const loadGoogleFont = async (font: string, weight: FontWeight) => {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@${weight}`
  const css = await fetch(url).then(r => r.text())

  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
  if (!match) {
    throw new Error(`Could not parse font URL for ${font}`)
  }

  const response = await fetch(match[1])
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.status}`)
  }

  return response.arrayBuffer()
}

export const fonts: Font[] = await Promise.all(
  ([400, 600] as const).map(weight =>
    loadGoogleFont("Geist", weight)
      .then(data => ({ name: "Geist", weight, data }) as Font)
      .catch(() => null),
  ),
).then(results => results.filter((f): f is Font => f !== null))
