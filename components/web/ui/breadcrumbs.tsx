import { Home } from "lucide-react"
import { type ComponentProps, Fragment, type ReactNode } from "react"
import { Stack } from "~/components/common/stack"
import { NavLink } from "~/components/web/ui/nav-link"
import { breadcrumbsConfig } from "~/config/breadcrumbs"
import { cx } from "~/lib/utils"

const BreadcrumbsSeparator = ({ ...props }: ComponentProps<"span">) => {
  return (
    <span className="text-sm text-ring pointer-events-none select-none" {...props}>
      /
    </span>
  )
}

type Breadcrumb = {
  url: string
  title: ReactNode
}

type BreadcrumbsProps = ComponentProps<typeof Stack> & {
  items: Breadcrumb[]
}

export const Breadcrumbs = ({ className, items, ...props }: BreadcrumbsProps) => {
  const breadcrumbItems = [{ url: "/", title: <Home aria-label="Home" /> }, ...items]

  return (
    <>
      {breadcrumbsConfig.enabled && (
        <Stack
          size="sm"
          wrap={false}
          className={cx("-mb-fluid-md pb-3 text-sm", className)}
          asChild
          {...props}
        >
          <nav>
            {breadcrumbItems.map(({ url, title }, index) => (
              <Fragment key={index}>
                {index > 0 && <BreadcrumbsSeparator />}
                <NavLink exact href={url} className="not-last:shrink-0 last:line-clamp-1">
                  {title}
                </NavLink>
              </Fragment>
            ))}
          </nav>
        </Stack>
      )}
    </>
  )
}
