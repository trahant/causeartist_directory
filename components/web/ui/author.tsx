import Image from "next/image"
import type { ComponentProps, ReactNode } from "react"
import { Stack } from "~/components/common/stack"
import { ExternalLink } from "~/components/web/external-link"

export type AuthorProps = ComponentProps<typeof Stack> & {
  name: string
  image: string
  url?: string
  note?: ReactNode
}

export const Author = ({ name, image, title, prefix, url, note, ...props }: AuthorProps) => {
  return (
    <Stack size="sm" wrap={false} {...props}>
      <Image
        src={image}
        alt={`${name}'s profile`}
        width={48}
        height={48}
        className="size-10 rounded-full group-hover:[[href]]:brightness-90"
      />

      <div className="flex-1 text-sm/normal text-secondary-foreground">
        <h3 className="truncate *:font-medium *:[[href]]:hover:text-foreground">
          {prefix ? `${prefix} ` : ""}
          {url ? <ExternalLink href={url}>{name}</ExternalLink> : <span>{name}</span>}
        </h3>

        {note && <span className="opacity-50 truncate">{note}</span>}
      </div>
    </Stack>
  )
}
