import { Slot } from "radix-ui"
import { type ElementType, type HTMLProps, isValidElement } from "react"
import { cva, cx, type VariantProps } from "~/lib/utils"

const headingVariants = cva({
  base: "font-display font-semibold",

  variants: {
    size: {
      h1: "text-3xl tracking-tight text-pretty text-foreground md:text-4xl",
      h2: "text-2xl tracking-micro md:text-3xl",
      h3: "text-2xl tracking-micro",
      h4: "text-xl tracking-micro",
      h5: "text-base font-sans font-medium",
      h6: "text-sm/tight font-sans font-medium",
    },
  },

  defaultVariants: {
    size: "h3",
  },
})

export type HeadingProps = Omit<HTMLProps<HTMLHeadingElement>, "size"> &
  VariantProps<typeof headingVariants> & {
    /**
     * If set to `true`, the button will be rendered as a child within the component.
     * This child component must be a valid React component.
     */
    as?: ElementType

    /**
     * If set to `true`, the button will be rendered as a child within the component.
     * This child component must be a valid React component.
     */
    asChild?: boolean
  }

const Heading = ({ className, as, asChild, size, ...props }: HeadingProps) => {
  const useAsChild = asChild && isValidElement(props.children)
  const Comp = useAsChild ? Slot.Root : (as ?? size ?? "h2")

  return <Comp className={cx(headingVariants({ size, className }))} {...props} />
}

const H1 = (props: HeadingProps) => {
  return <Heading size="h1" {...props} />
}

const H2 = (props: HeadingProps) => {
  return <Heading size="h2" {...props} />
}

const H3 = (props: HeadingProps) => {
  return <Heading size="h3" {...props} />
}

const H4 = (props: HeadingProps) => {
  return <Heading size="h4" {...props} />
}

const H5 = (props: HeadingProps) => {
  return <Heading size="h5" {...props} />
}

const H6 = (props: HeadingProps) => {
  return <Heading size="h6" {...props} />
}

export { Heading, H1, H2, H3, H4, H5, H6 }
