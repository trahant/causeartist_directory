import type { ComponentProps } from "react"
import { cx } from "~/lib/utils"

type ButtonGroupProps = ComponentProps<"div">

const ButtonGroup = ({ className, ...props }: ButtonGroupProps) => {
  return (
    <div
      className={cx(
        "flex items-center [&>*]:rounded-none [&>*]:focus-within:z-10 [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px",
        className,
      )}
      {...props}
    />
  )
}

export { ButtonGroup }
