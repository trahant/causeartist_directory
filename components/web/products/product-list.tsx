import type { ComponentProps } from "react"
import { ProductSkeleton } from "~/components/web/products/product"
import { cx } from "~/lib/utils"

export const ProductList = ({ className, ...props }: ComponentProps<"div">) => {
  return <div className={cx("flex flex-wrap justify-center gap-5", className)} {...props} />
}

export const ProductListSkeleton = ({ ...props }: ComponentProps<"div">) => {
  return (
    <ProductList {...props}>
      {[...Array(3)].map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </ProductList>
  )
}
