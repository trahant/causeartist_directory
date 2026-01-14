"use client"

import { Tooltip as TooltipPrimitive } from "radix-ui"
import type { ComponentProps, ReactNode } from "react"
import { cva, cx, type VariantProps } from "~/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider
const TooltipRoot = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipPortal = TooltipPrimitive.Portal
const TooltipArrow = TooltipPrimitive.Arrow

const tooltipContentVariants = cva({
  base: "z-50 max-w-[20em] inline-flex items-center gap-2 bg-foreground text-background text-center text-pretty rounded-md shadow-md will-change-[transform,opacity]",

  variants: {
    size: {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-[13px]",
      lg: "px-5 py-3.5 text-sm",
    },
  },

  defaultVariants: {
    size: "sm",
  },
})

type TooltipContentProps = ComponentProps<typeof TooltipPrimitive.Content> &
  VariantProps<typeof tooltipContentVariants>

const TooltipContent = ({ className, sideOffset = 4, size, ...props }: TooltipContentProps) => {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cx(tooltipContentVariants({ size, className }))}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}

type TooltipProps = ComponentProps<typeof TooltipPrimitive.Root> &
  ComponentProps<typeof TooltipContent> & {
    tooltip: ReactNode
  }

const TooltipBase = ({ children, delayDuration, tooltip, ...rest }: TooltipProps) => {
  if (!tooltip) {
    return children
  }

  return (
    <TooltipRoot delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>

      <TooltipPortal>
        <TooltipContent {...rest}>
          {tooltip}
          <TooltipArrow className="fill-foreground" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  )
}

const Tooltip = Object.assign(TooltipBase, {
  Provider: TooltipProvider,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Content: TooltipContent,
  Arrow: TooltipArrow,
})

export { Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, TooltipProvider }
