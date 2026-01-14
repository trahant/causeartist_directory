import type { ComponentProps } from "react"
import { Markdown } from "~/components/web/markdown"
import { Author, type AuthorProps } from "~/components/web/ui/author"
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

type TestimonialProps = ComponentProps<"blockquote"> &
  VariantProps<typeof testimonialVariants> & {
    quote: string
    author: AuthorProps
  }

export const Testimonial = ({
  quote,
  author,
  className,
  alignment,
  ...props
}: TestimonialProps) => {
  return (
    <blockquote className={cx(testimonialVariants({ alignment, className }))} {...props}>
      <Markdown className="text-lg/relaxed" code={quote} />

      <Author {...author} />
    </blockquote>
  )
}
