import type { ComponentProps } from "react"
import { cva, cx, type VariantProps } from "~/lib/utils"

const stickyVariants = cva({
  base: "md:sticky md:z-49 w-full min-w-0",

  variants: {
    isOverlay: {
      true:
        "md:top-(--header-inner-offset) md:p-(--header-bottom) md:-m-(--header-bottom) md:bg-background flex flex-row",
      false: "md:top-(--header-outer-offset)",
    },
  },

  defaultVariants: {
    isOverlay: false,
  },
})

type StickyProps = ComponentProps<"div"> & VariantProps<typeof stickyVariants>

/** Plain wrapper (not Radix Slot) so trees stay stable under `display: contents` parents (e.g. `max-md:contents`). */
export const Sticky = ({ className, isOverlay, ...props }: StickyProps) => {
  return <div className={cx(stickyVariants({ isOverlay, className }))} {...props} />
}
