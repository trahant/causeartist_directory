import { NextResponse } from "next/server"
import { sitemaps } from "~/app/sitemap/[id]/route"
import { siteConfig } from "~/config/site"

const buildSitemapIndex = (sitemaps: string[]) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>'
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

  for (const url of sitemaps) {
    xml += "<sitemap>"
    xml += `<loc>${url}</loc>`
    xml += "</sitemap>"
  }

  xml += "</sitemapindex>"
  return xml
}

export function GET() {
  const { url } = siteConfig
  const sitemapIndexXML = buildSitemapIndex(sitemaps.map(id => `${url}/sitemap/${id}.xml`))

  return new NextResponse(sitemapIndexXML, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Length": Buffer.byteLength(sitemapIndexXML).toString(),
    },
  })
}
