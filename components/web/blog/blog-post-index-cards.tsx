import Image from "next/image"
import NextLink from "next/link"
import { Card, CardDescription, CardFooter, CardHeader } from "~/components/common/card"
import { H2, H4 } from "~/components/common/heading"
import { Stack } from "~/components/common/stack"
import type { BlogPostMany } from "~/server/web/blog/payloads"

const heroImage = (url: string | null | undefined, alt: string, sizes: string) => {
  if (url) {
    return (
      <div className="relative w-full aspect-video bg-muted md:min-h-[280px] md:h-full md:aspect-auto shrink-0">
        <Image src={url} alt={alt} fill className="object-cover" sizes={sizes} />
      </div>
    )
  }
  return <div className="w-full aspect-video bg-muted md:min-h-[280px] md:h-full shrink-0" aria-hidden />
}

type DateParts = {
  label: string
  iso?: string
}

type BlogFeaturedPostProps = {
  post: BlogPostMany
  date: DateParts
}

export const BlogFeaturedPost = ({ post, date }: BlogFeaturedPostProps) => {
  return (
    <Card className="gap-0 p-0 overflow-hidden">
      <NextLink
        href={`/blog/${post.slug}`}
        className="grid w-full min-w-0 grid-cols-1 text-start md:grid-cols-2 md:gap-0 md:items-stretch group rounded-lg"
      >
        <div className="md:contents">
          {heroImage(
            post.heroImageUrl,
            post.title,
            "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 720px",
          )}
        </div>
        <Stack className="w-full gap-4 p-6 md:py-8 md:px-8 md:justify-center">
          <H2 as="h2" className="leading-snug! text-pretty group-hover:underline underline-offset-4">
            {post.title}
          </H2>
          {post.excerpt ? (
            <p className="text-base text-secondary-foreground text-pretty line-clamp-3">{post.excerpt}</p>
          ) : null}
          {date.label ? (
            <p className="text-sm text-muted-foreground">
              {date.iso ? <time dateTime={date.iso}>{date.label}</time> : date.label}
            </p>
          ) : null}
        </Stack>
      </NextLink>
    </Card>
  )
}

type BlogPostIndexCardProps = {
  post: BlogPostMany
  date: DateParts
}

export const BlogPostIndexCard = ({ post, date }: BlogPostIndexCardProps) => {
  return (
    <Card className="gap-0 p-0 overflow-hidden">
      <NextLink
        href={`/blog/${post.slug}`}
        className="flex flex-col w-full min-w-0 text-start rounded-lg"
      >
        {post.heroImageUrl ? (
          <div className="relative w-full aspect-video bg-muted shrink-0">
            <Image
              src={post.heroImageUrl}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-muted shrink-0" aria-hidden />
        )}
        <Stack className="w-full gap-4 p-5">
          <CardHeader wrap={false}>
            <H4 as="h3" className="leading-snug! line-clamp-2">
              {post.title}
            </H4>
          </CardHeader>
          {post.excerpt ? <CardDescription>{post.excerpt}</CardDescription> : null}
          <CardFooter>
            {date.label ? (
              date.iso ? (
                <time dateTime={date.iso}>{date.label}</time>
              ) : (
                <span>{date.label}</span>
              )
            ) : null}
          </CardFooter>
        </Stack>
      </NextLink>
    </Card>
  )
}
