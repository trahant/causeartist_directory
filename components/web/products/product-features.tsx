import { CheckIcon, XIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { Ping } from "~/components/common/ping"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import type { ProductFeature } from "~/lib/products"
import { cva, cx } from "~/lib/utils"

const featureVariants = cva({
  base: "flex gap-3 text-sm",

  variants: {
    type: {
      positive: "",
      neutral: "",
      negative: "text-muted-foreground",
    },
  },
})

const featureCheckVariants = cva({
  base: "shrink-0 size-5 stroke-[3px] p-1 rounded-md",

  variants: {
    type: {
      positive: "bg-primary/75 text-primary-foreground",
      neutral: "bg-foreground/10",
      negative: "bg-foreground/10",
    },
  },
})

type ProductFeaturesProps = ComponentProps<typeof Stack> & {
  features: ProductFeature[]
}

export const ProductFeatures = ({ features, className, ...props }: ProductFeaturesProps) => {
  if (!features.length) return null

  return (
    <Stack direction="column" className={cx("my-auto flex-1 items-stretch", className)} {...props}>
      {features.map(({ type, name, footnote }, i) => {
        const Icon = type === "negative" ? XIcon : CheckIcon

        return (
          <div key={String(name) + i} className={cx(featureVariants({ type }))}>
            <Icon className={cx(featureCheckVariants({ type }))} />

            {name}

            {footnote && (
              <Tooltip tooltip={footnote} delayDuration={0}>
                <Ping className="-ml-1 mt-1" />
              </Tooltip>
            )}
          </div>
        )
      })}
    </Stack>
  )
}
