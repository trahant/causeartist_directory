import DOMPurify from "isomorphic-dompurify"

// Allowed HTML tags for content rendering
const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "b", "i", "u", "s",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img",
  "blockquote", "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td",
  "div", "span", "figure", "figcaption",
  "iframe", "video", "audio",
]

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class", "id",
  "target", "rel", "width", "height",
  "style", "frameborder", "allowfullscreen",
  "controls", "autoplay", "loop", "muted",
  "data-kg-custom-thumbnail", "data-kg-thumbnail",
  "playsinline", "preload", "poster",
  "loading", "decoding", "fetchpriority",
  "srcset", "sizes", "type",
]

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ""

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
  })
}
