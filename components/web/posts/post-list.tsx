import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { EmptyList } from "~/components/web/empty-list"
import { PostCard, PostCardSkeleton } from "~/components/web/posts/post-card"
import { Grid } from "~/components/web/ui/grid"
import type { PostMany } from "~/server/web/posts/payloads"

type PostListProps = ComponentProps<typeof Grid> & {
  posts: PostMany[]
}

const PostList = ({ children, posts, ...props }: PostListProps) => {
  const t = useTranslations()

  return (
    <Grid {...props}>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      {!posts.length && <EmptyList>{t("posts.no_posts")}</EmptyList>}
      {children}
    </Grid>
  )
}

const PostListSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <Grid>
      {[...Array(count)].map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </Grid>
  )
}

export { PostList, PostListSkeleton, type PostListProps }
