"use client"

import { getReadTime } from "@primoui/utils"
import { useFormatter, useTranslations } from "next-intl"
import Image from "next/image"
import type { ComponentProps } from "react"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H4 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Skeleton } from "~/components/common/skeleton"
import { cx } from "~/lib/utils"
import type { PostMany } from "~/server/web/posts/payloads"

type PostCardProps = ComponentProps<typeof Card> & {
  post: PostMany
}

const PostCard = ({ className, post, ...props }: PostCardProps) => {
  const t = useTranslations()
  const format = useFormatter()

  return (
    <Card className={cx("overflow-clip", className)} asChild {...props}>
      <Link href={`/blog/${post.slug}`}>
        {post.imageUrl && (
          <Image
            src={post.imageUrl}
            alt={post.title}
            width={1200}
            height={630}
            className="-m-5 mb-0 w-[calc(100%+2.5rem)] max-w-none aspect-video object-cover"
          />
        )}

        <CardHeader wrap={false}>
          <H4 as="h3" className="leading-snug!">
            {post.title}
          </H4>
        </CardHeader>

        {post.description && <CardDescription>{post.description}</CardDescription>}

        {post.publishedAt && (
          <CardFooter className="mt-auto">
            <time dateTime={post.publishedAt.toISOString()}>
              {format.dateTime(post.publishedAt, { dateStyle: "medium" })}
            </time>
            <span>&bull;</span>
            <span>{t("posts.read_time", { count: getReadTime(post.plainText) })}</span>
          </CardFooter>
        )}
      </Link>
    </Card>
  )
}

const PostCardSkeleton = () => {
  return (
    <Card hover={false} className="overflow-clip select-none">
      {/* Image skeleton - full width aspect-video */}
      <Skeleton className="w-full aspect-video" />

      <CardHeader wrap={false}>
        <H4 className="w-2/3">
          <Skeleton>&nbsp;</Skeleton>
        </H4>
      </CardHeader>

      {/* Description skeleton - 2 lines */}
      <CardDescription className="flex flex-col gap-0.5">
        <Skeleton className="h-5 w-4/5">&nbsp;</Skeleton>
        <Skeleton className="h-5 w-1/2">&nbsp;</Skeleton>
      </CardDescription>

      {/* Footer skeleton - date and read time */}
      <CardFooter className="mt-auto gap-2">
        <Skeleton className="h-5 w-24">&nbsp;</Skeleton>
        <span>&bull;</span>
        <Skeleton className="h-5 w-20">&nbsp;</Skeleton>
      </CardFooter>
    </Card>
  )
}

export { PostCard, PostCardSkeleton }
