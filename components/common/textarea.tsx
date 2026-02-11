import type { ComponentProps } from "react"
import { Box } from "~/components/common/box"
import { inputVariants } from "~/components/common/input"
import { cx, type VariantProps } from "~/lib/utils"

export type TextAreaProps = Omit<ComponentProps<"textarea">, "size"> &
  VariantProps<typeof inputVariants>

export const TextArea = ({ className, size, ...props }: TextAreaProps) => {
  return (
    <Box focus>
      <textarea
        className={cx(
          inputVariants({ size, className }),
          "leading-normal! resize-y field-sizing-content",
        )}
        {...props}
      />
    </Box>
  )
}
