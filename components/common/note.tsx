import type { ComponentProps, ElementType } from "react"
import { cx } from "~/lib/utils"

type NoteProps = ComponentProps<"p"> & {
  as?: ElementType
}

export const Note = ({ className, as, ...props }: NoteProps) => {
  const Comp = as || "p"

  return <Comp className={cx("text-sm/normal text-muted-foreground", className)} {...props} />
}
