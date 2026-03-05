import type { ComponentProps } from "react"
import { cx } from "~/lib/utils"

type ButtonGroupProps = ComponentProps<"div">

const ButtonGroup = ({ className, ...props }: ButtonGroupProps) => {
  return (
    <div
      role="group"
      className={cx(
        "flex items-center *:rounded-none *:focus-within:z-10 *:first:rounded-l-md *:last:rounded-r-md *:not-first:-ml-px",
        className,
      )}
      {...props}
    />
  )
}

export { ButtonGroup }
