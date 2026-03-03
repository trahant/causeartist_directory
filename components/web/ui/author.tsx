import Image from "next/image"
import type { ComponentProps, ReactNode } from "react"
import { Stack } from "~/components/common/stack"
import { ExternalLink } from "~/components/web/external-link"

export type AuthorProps = ComponentProps<typeof Stack> & {
  name: string
  image: string
  prefix?: string
  url?: string
  note?: ReactNode
}

export const Author = ({ name, image, prefix, url, note, ...props }: AuthorProps) => {
  return (
    <Stack wrap={false} {...props}>
      {image && (
        <Image
          src={image}
          alt={`${name}'s profile`}
          width={48}
          height={48}
          className="size-10 rounded-md group-hover:[[href]]:brightness-90"
        />
      )}

      <div className="flex-1 min-w-0 text-sm/normal text-secondary-foreground">
        <h3 className="truncate *:font-medium *:[[href]]:hover:text-foreground">
          {prefix ? `${prefix} ` : ""}
          {url ? <ExternalLink href={url}>{name}</ExternalLink> : <span>{name}</span>}
        </h3>

        {note && <div className="opacity-50 truncate">{note}</div>}
      </div>
    </Stack>
  )
}
