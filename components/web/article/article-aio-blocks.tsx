import { Link } from "~/components/common/link"
import { H3, H4 } from "~/components/common/heading"
import { Stack } from "~/components/common/stack"
import {
  readFaqItemsFromDb,
  readKeyTakeawaysFromDb,
  readSourcesFromDb,
} from "~/lib/article-seo-json"

type Props = {
  sources: unknown
  faqItems: unknown
  keyTakeaways: unknown
}

export function ArticleAioBlocks({ sources, faqItems, keyTakeaways }: Props) {
  const takeaways = readKeyTakeawaysFromDb(keyTakeaways)
  const sourceRows = readSourcesFromDb(sources)
  const faqs = readFaqItemsFromDb(faqItems)

  if (takeaways.length === 0 && sourceRows.length === 0 && faqs.length === 0) return null

  return (
    <Stack size="lg" className="col-span-full mt-10 gap-10">
      {takeaways.length > 0 && (
        <section aria-labelledby="article-key-takeaways">
          <H3 id="article-key-takeaways" className="text-xl">
            Key takeaways
          </H3>
          <ul className="mt-3 list-disc pl-5 text-muted-foreground space-y-2">
            {takeaways.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {sourceRows.length > 0 && (
        <aside aria-labelledby="article-sources">
          <H3 id="article-sources" className="text-xl">
            Sources
          </H3>
          <ol className="mt-3 list-decimal pl-5 space-y-2 text-sm">
            {sourceRows.map((s, i) => (
              <li key={i}>
                <Link href={s.url} className="text-primary underline" rel="noopener noreferrer">
                  {s.title}
                </Link>
                {(s.publisher || s.publishedAt) && (
                  <span className="text-muted-foreground">
                    {" "}
                    {s.publisher ? ` — ${s.publisher}` : ""}
                    {s.publishedAt ? ` (${s.publishedAt})` : ""}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </aside>
      )}

      {faqs.length > 0 && (
        <section aria-labelledby="article-faq">
          <H3 id="article-faq" className="text-xl">
            FAQ
          </H3>
          <Stack size="md" className="mt-4">
            {faqs.map((row, i) => (
              <div key={i} className="border-b border-border pb-4 last:border-0">
                <H4 className="text-base font-medium text-foreground">{row.question}</H4>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{row.answer}</p>
              </div>
            ))}
          </Stack>
        </section>
      )}
    </Stack>
  )
}
