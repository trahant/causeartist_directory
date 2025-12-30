import { NextResponse } from "next/server"
import { sitemaps } from "~/app/sitemap/[id]/route"
import { siteConfig } from "~/config/site"

const buildSitemapIndex = (sitemaps: string[]) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>'
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

  for (const sitemapURL of sitemaps) {
    xml += "<sitemap>"
    xml += `<loc>${sitemapURL}</loc>`
    xml += "</sitemap>"
  }

  xml += "</sitemapindex>"
  return xml
}

export const GET = () => {
  const { url } = siteConfig
  const sitemapIndexXML = buildSitemapIndex(sitemaps.map(id => `${url}/sitemap/${id}.xml`))

  return new NextResponse(sitemapIndexXML, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Length": Buffer.byteLength(sitemapIndexXML).toString(),
    },
  })
}
