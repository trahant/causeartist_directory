import { getTranslations } from "next-intl/server"
import type { ComponentProps } from "react"
import { H6 } from "~/components/common/heading"
import { Stack } from "~/components/common/stack"
import { Wrapper } from "~/components/common/wrapper"
import { Container } from "~/components/web/ui/container"
import { NavLink } from "~/components/web/ui/nav-link"
import { Tile, TileCaption, TileDivider } from "~/components/web/ui/tile"
import { cx } from "~/lib/utils"
import { findCategories } from "~/server/web/categories/queries"

export const Bottom = async ({ className, ...props }: ComponentProps<typeof Wrapper>) => {
  const t = await getTranslations("components.bottom")

  const categories = await findCategories({
    orderBy: { tools: { _count: "desc" } },
    take: 12,
  })

  if (!categories?.length) {
    return null
  }

  return (
    <Container>
      <Wrapper className={cx("py-fluid-md border-t border-foreground/10", className)} {...props}>
        {!!categories?.length && (
          <Stack className="gap-x-4 text-sm">
            <H6 as="strong">{t("popular_categories")}</H6>

            <div className="grid grid-cols-2xs gap-x-4 gap-y-2 w-full sm:grid-cols-xs md:grid-cols-sm">
              {categories.map(({ slug, label, _count }) => (
                <Tile key={slug} className="gap-2" asChild>
                  <NavLink href={`/categories/${slug}`}>
                    <span className="truncate">{label}</span>
                    <TileDivider />
                    <TileCaption className="max-sm:hidden">{_count.tools}</TileCaption>
                  </NavLink>
                </Tile>
              ))}
            </div>
          </Stack>
        )}
      </Wrapper>
    </Container>
  )
}
