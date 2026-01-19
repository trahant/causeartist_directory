import { notFound } from "next/navigation"
import type { NextRequest } from "next/server"
import { getTranslations } from "next-intl/server"
import { createLoader, parseAsInteger, parseAsStringEnum } from "nuqs/server"
import satori from "satori"
import { ToolStatus } from "~/.generated/prisma/client"
import { LogoSymbol } from "~/components/web/ui/logo-symbol"
import { siteConfig } from "~/config/site"
import { fonts } from "~/lib/fonts"
import { isToolPublished } from "~/lib/tools"
import { findTool } from "~/server/web/tools/queries"

const THEMES = {
  light: {
    background: "hsl(0 0% 100%)",
    border: "hsl(0 0% 83%)",
    text: "hsl(0 0% 12%)",
    logo: "hsl(234, 98%, 61%)",
  },
  dark: {
    background: "hsl(0 0% 5%)",
    border: "hsl(0 0% 20%)",
    text: "hsl(0 0% 90%)",
    logo: "hsl(0 0% 90%)",
  },
} as const

type SvgBadgeProps = {
  theme: keyof typeof THEMES
  label: string
}

const SvgBadge = ({ theme, label }: SvgBadgeProps) => {
  const colors = THEMES[theme]

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: "0.75em",
        display: "flex",
        alignItems: "center",
        gap: "0.8em",
        paddingLeft: "0.8em",
        paddingRight: "0.8em",
        color: colors.text,
        fontFamily: "Geist",
        overflow: "hidden",
      }}
    >
      <LogoSymbol
        style={{
          height: "1.25em",
          width: "1.25em",
          color: colors.logo,
          flexShrink: 0,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            lineHeight: 1,
            opacity: 0.75,
          }}
        >
          {label}
        </span>

        <span
          style={{
            fontSize: 16,
            fontFamily: "Geist",
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "-0.025em",
            whiteSpace: "nowrap",
          }}
        >
          {siteConfig.name}
        </span>
      </div>

      <LogoSymbol
        style={{
          height: "4.8em",
          width: "4.8em",
          position: "absolute",
          top: "50%",
          right: "-1em",
          transform: "translateY(-50%) rotate(12deg)",
          marginTop: "0.5em",
          color: colors.logo,
          opacity: theme === "dark" ? 0.1 : 0.05,
        }}
      />
    </div>
  )
}

const searchParamsLoader = createLoader({
  theme: parseAsStringEnum(["light", "dark"]).withDefault("light"),
  width: parseAsInteger.withDefault(200),
  height: parseAsInteger.withDefault(50),
})

export async function GET({ url }: NextRequest, { params }: RouteContext<"/[slug]/badge.svg">) {
  const { slug } = await params
  const { theme, width, height } = searchParamsLoader(url)

  const tool = await findTool({
    where: {
      slug,
      status: { in: [ToolStatus.Published, ToolStatus.Scheduled] },
    },
  })

  if (!tool) {
    notFound()
  }

  const t = await getTranslations()
  const label = t(`common.${isToolPublished(tool) ? "featured" : "coming_soon"}`)
  const svg = await satori(<SvgBadge theme={theme} label={label} />, { width, height, fonts })

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "CDN-Cache-Control": "max-age=86400",
    },
  })
}
