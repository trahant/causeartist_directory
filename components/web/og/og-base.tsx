import { getExcerpt } from "@primoui/utils"
import { LogoSymbol } from "~/components/web/ui/logo-symbol"
import type { OpenGraphParams } from "~/lib/opengraph"

type OgBaseProps = OpenGraphParams & {
  siteName: string
  siteTagline: string
}

export const OgBase = ({ title, description, faviconUrl, siteName, siteTagline }: OgBaseProps) => {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "#fafafa",
        color: "#1F1F1F",
        fontFamily: "Geist",
      }}
    >
      <LogoSymbol
        style={{
          height: "36em",
          width: "36em",
          position: "absolute",
          top: "-25%",
          right: "-10%",
          transform: "rotate(12deg)",
          opacity: 0.05,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "4rem",
          padding: "3.5rem 4rem",
          width: "100%",
          backgroundImage: "linear-gradient(to bottom, transparent 60%, rgba(0, 0, 0, 0.05))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24" }}>
          {faviconUrl && (
            <img
              src={faviconUrl}
              alt=""
              width={92}
              height={92}
              style={{ borderRadius: "0.5rem" }}
            />
          )}

          <p
            style={{
              maxWidth: "90%",
              marginTop: "-1%",
              marginBottom: "-1%",
              fontSize: "3.4rem",
              fontFamily: "Geist",
              fontWeight: 600,
              lineHeight: "1.05",
              textWrap: "balance",
            }}
          >
            {getExcerpt(title, 60)}
          </p>
        </div>

        <p
          style={{
            fontSize: "2.8rem",
            lineHeight: "1.33",
            letterSpacing: "-0.015em",
            marginTop: "-1rem",
            opacity: 0.75,
          }}
        >
          {getExcerpt(description, 125)}
        </p>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12",
            fontSize: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12",
              fontSize: "2rem",
            }}
          >
            <LogoSymbol style={{ height: "1.25em", width: "1.25em" }} />
            <span>{siteName}</span>
          </div>

          <span style={{ opacity: 0.5, fontSize: "1.6rem" }}>{siteTagline}</span>
        </div>
      </div>
    </div>
  )
}
