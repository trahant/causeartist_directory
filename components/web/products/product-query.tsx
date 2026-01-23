import { isTruthy } from "@primoui/utils"
import { createLoader, parseAsString, type SearchParams } from "nuqs/server"
import type { ComponentProps } from "react"
import { Product } from "~/components/web/products/product"
import { ProductList } from "~/components/web/products/product-list"
import { getProductsForListing, type ProductProps, type ProductWithPrices } from "~/lib/products"

type ProductQueryProps = ComponentProps<typeof ProductList> & {
  searchParams: Promise<SearchParams>
  checkoutData: ComponentProps<typeof Product>["checkoutData"]
  getProductProps?: (item: ProductWithPrices) => ProductProps
}

export const ProductQuery = async ({
  searchParams,
  checkoutData,
  getProductProps,
  ...props
}: ProductQueryProps) => {
  const loadSearchParams = createLoader({ discountCode: parseAsString.withDefault("") })
  const { discountCode } = await loadSearchParams(searchParams)
  const products = await getProductsForListing(discountCode)

  const items = products
    .map(item => ({ ...item, customProps: getProductProps?.(item) }))
    .filter(({ customProps }) => isTruthy(customProps))

  return (
    <ProductList {...props}>
      {items.map(({ product, prices, coupon, customProps }, index) => (
        <Product
          key={product.id}
          data={{ product: { ...product, ...customProps?.product }, prices, coupon }}
          checkoutData={checkoutData}
          isHighlighted={index === items.length - 1}
          isDisabled={customProps?.isDisabled}
          buttonLabel={customProps?.buttonLabel}
        />
      ))}
    </ProductList>
  )
}
