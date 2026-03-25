import type { ComponentProps } from "react"
import { cx } from "~/lib/utils"

export const proseContentClasses = [
  "prose prose-neutral dark:prose-invert",
  "prose-a:font-medium prose-a:text-foreground prose-a:decoration-foreground/30 prose-a:hover:text-primary prose-a:hover:decoration-primary/60",
  "prose-strong:text-foreground prose-strong:font-semibold",
  "prose-p:first:mt-0 prose-p:last:mb-0 prose-ul:first:mt-0 prose-ul:last:mb-0 prose-li:mt-2 prose-li:first:m-0",
  "prose-img:border prose-img:rounded-lg prose-lead:text-lg/relaxed prose-pre:font-mono prose-pre:rounded-lg",
  "prose-headings:text-foreground prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-micro",
  "prose-code:before:hidden prose-code:after:hidden prose-code:bg-foreground/10 prose-code:rounded prose-code:mx-[0.088em] prose-code:px-[0.33em] prose-code:py-[0.166em] prose-code:font-normal",
  "prose-headings:mt-[1.5em] prose-headings:mb-[0.75em] prose-headings:first:mt-0 prose-headings:last:mb-0 prose-headings:scroll-mt-(--header-outer-offset)",
  "prose-h1:text-3xl md:prose-h1:text-4xl prose-h2:text-2xl md:prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-h5:text-base prose-h5:font-medium prose-h5:tracking-micro prose-h6:text-sm prose-h6:font-medium prose-h6:tracking-normal",
  "prose-table:border prose-table:border-border prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:font-medium prose-th:p-2 prose-th:px-3 prose-th:text-left prose-td:border prose-td:border-border prose-td:p-2 prose-td:px-3 prose-td:text-left prose-td:align-top",
  // Ghost kg-embed / iframes: full column width, consistent vertical rhythm with prose
  "[&_iframe]:max-w-full [&_iframe]:w-full [&_iframe]:rounded-lg",
  "[&_figure]:mx-0 [&_figure]:max-w-full",
  "[&_.kg-card]:max-w-full [&_.kg-card]:w-full",
  "[&_.kg-embed-card]:my-6",
  // Ghost highlights / marks: keep legible in light and dark
  "[&_mark]:bg-amber-200/50 [&_mark]:text-foreground dark:[&_mark]:bg-amber-400/25 dark:[&_mark]:text-foreground",
]

export const Prose = ({
  className,
  dangerouslySetInnerHTML,
  suppressHydrationWarning,
  ...props
}: ComponentProps<"div">) => {
  // CMS HTML (iframes, embeds) is often rewritten by the browser so innerHTML
  // differs between server render and client hydration — safe to ignore on this wrapper.
  const suppressInnerHtmlMismatch =
    suppressHydrationWarning ?? dangerouslySetInnerHTML !== undefined

  return (
    <div
      className={cx(
        "w-full text-pretty leading-relaxed text-foreground/90 prose-p:text-foreground/90",
        ...proseContentClasses,
        className,
      )}
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
      suppressHydrationWarning={suppressInnerHtmlMismatch}
      {...props}
    />
  )
}
