import { getTranslations } from "next-intl/server"
import type { ComponentProps } from "react"
import { Markdown } from "~/components/web/markdown"
import { Author } from "~/components/web/ui/author"
import { siteConfig } from "~/config/site"
import { cva, cx, type VariantProps } from "~/lib/utils"

const testimonialVariants = cva({
  base: "flex flex-col gap-4 max-w-2xl",

  variants: {
    alignment: {
      start: "items-start text-start mr-auto",
      center: "items-center text-center mx-auto",
      end: "items-end text-end ml-auto",
    },
  },

  defaultVariants: {
    alignment: "center",
  },
})

type TestimonialProps = ComponentProps<"blockquote"> & VariantProps<typeof testimonialVariants>

export const Testimonial = async ({ className, alignment, ...props }: TestimonialProps) => {
  const t = await getTranslations("components.testimonial")

  return (
    <blockquote className={cx(testimonialVariants({ alignment, className }))} {...props}>
      <Markdown className="text-lg/relaxed" code={t("quote", { siteName: siteConfig.name })} />

      <Author
        name={t("author.name")}
        note={t("author.note")}
        image="/authors/piotrkulpinski.webp"
      />
    </blockquote>
  )
}
