import { Slot } from "radix-ui"
import { type ComponentProps, isValidElement, type ReactNode } from "react"
import { Slottable } from "~/components/common/slottable"
import { cva, cx, type VariantProps } from "~/lib/utils"

const tagVariants = cva({
  base: "flex items-center gap-0.5 text-muted-foreground text-sm hover:[[href]]:text-foreground",
})

type TagProps = Omit<ComponentProps<"span">, "prefix"> &
  VariantProps<typeof tagVariants> & {
    /**
     * If set to `true`, the button will be rendered as a child within the component.
     * This child component must be a valid React component.
     */
    asChild?: boolean

    /**
     * The slot to be rendered before the label.
     */
    prefix?: ReactNode

    /**
     * The slot to be rendered after the label.
     */
    suffix?: ReactNode
  }

export const Tag = ({ children, className, asChild, prefix, suffix, ...props }: TagProps) => {
  const useAsChild = asChild && isValidElement(children)
  const Comp = useAsChild ? Slot.Root : "span"

  return (
    <Comp className={cx(tagVariants({ className }))} {...props}>
      <Slottable child={children} asChild={asChild}>
        {child => (
          <>
            {prefix && <Slot.Root className="opacity-30 mr-0.5">{prefix}</Slot.Root>}
            {child}
            {suffix && <Slot.Root className="opacity-30 ml-0.5">{suffix}</Slot.Root>}
          </>
        )}
      </Slottable>
    </Comp>
  )
}
