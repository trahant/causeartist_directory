import { capitalCase } from "change-case"
import type { ComponentProps } from "react"
import { cva, cx, type VariantProps } from "~/lib/utils"

const kbdVariants = cva({
  base: "inline-flex gap-[0.15em] -my-0.5 px-[0.4em] py-[0.088em] whitespace-nowrap rounded-sm border text-xs/tight font-system font-medium",

  variants: {
    variant: {
      soft: "border-transparent bg-foreground/7.5",
      outline:
        "border-[light-dark(var(--color-foreground),var(--color-background))]/15 bg-[light-dark(var(--color-foreground),var(--color-background))]/10",
    },
  },

  defaultVariants: {
    variant: "soft",
  },
})

const modifiers: Record<string, string> = {
  shift: "⇧",
  meta: "⌘",
  alt: "⌥",
  ctrl: "⌃",
  enter: "⏎",
}

type KbdProps = Omit<ComponentProps<"kbd">, "children"> &
  VariantProps<typeof kbdVariants> & {
    keys: string[]
  }

export const Kbd = ({ keys, className, variant, ...props }: KbdProps) => {
  return (
    <kbd className={cx(kbdVariants({ variant, className }))} {...props}>
      {keys.map(key => {
        const lowerKey = key.toLowerCase()
        const symbol = modifiers[lowerKey]

        if (symbol) {
          return (
            <span key={key}>
              <span className="sr-only">{capitalCase(lowerKey)}</span>
              <span aria-hidden="true">{symbol}</span>
            </span>
          )
        }

        return <span key={key}>{key.toUpperCase()}</span>
      })}
    </kbd>
  )
}
