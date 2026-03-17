import type { Metadata } from "next"
import { cache } from "react"
import { H2 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Stack } from "~/components/common/stack"
import { StructuredData } from "~/components/web/structured-data"
import { Breadcrumbs } from "~/components/web/ui/breadcrumbs"
import { Intro, IntroDescription, IntroTitle } from "~/components/web/ui/intro"
import { Section } from "~/components/web/ui/section"
import { getPageData, getPageMetadata } from "~/lib/pages"
import { generateCollectionPage } from "~/lib/structured-data"
import { findGlossaryTerms } from "~/server/web/glossary/queries"
import type { GlossaryTermMany } from "~/server/web/glossary/payloads"

const url = "/glossary"
const title = "Impact Investing Glossary | Causeartist"
const description =
  "Plain language definitions for impact investing, ESG, and sustainable business terms."

const getData = cache(async () => {
  const terms = await findGlossaryTerms({
    where: { status: { in: ["draft", "published"] } },
  })
  const byLetter = terms.reduce<Record<string, GlossaryTermMany[]>>((acc, term) => {
    const letter = (term.term[0] ?? "?").toUpperCase()
    if (!/^[A-Z]$/.test(letter)) {
      const key = "#"
      if (!acc[key]) acc[key] = []
      acc[key].push(term)
    } else {
      if (!acc[letter]) acc[letter] = []
      acc[letter].push(term)
    }
    return acc
  }, {})
  const letters = Object.keys(byLetter).sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))

  const data = getPageData(url, title, description, {
    breadcrumbs: [{ url, title: "Glossary" }],
    structuredData: [generateCollectionPage(url, title, description)],
  })
  return { ...data, terms, byLetter, letters }
})

export const generateMetadata = async (): Promise<Metadata> => {
  const { url: pageUrl, metadata } = await getData()
  return getPageMetadata({ url: pageUrl, metadata })
}

export default async function GlossaryPage() {
  const { metadata, breadcrumbs, structuredData, byLetter, letters } =
    await getData()

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <Intro>
        <IntroTitle>{metadata.title}</IntroTitle>
        <IntroDescription>{metadata.description}</IntroDescription>
      </Intro>

      <Section>
        <Section.Content>
          <Stack direction="column" className="w-full gap-8">
            {letters.map((letter: string) => (
              <Stack key={letter} direction="column" className="gap-3">
                <H2 as="h2" id={letter} className="text-xl">
                  {letter}
                </H2>
                <ul className="list-none space-y-2 pl-0">
                  {byLetter[letter]!.map((term: GlossaryTermMany) => (
                    <li key={term.id}>
                      <Link href={`/glossary/${term.slug}`}>{term.term}</Link>
                    </li>
                  ))}
                </ul>
              </Stack>
            ))}
          </Stack>
          {letters.length === 0 && (
            <p className="text-muted-foreground">No glossary terms found.</p>
          )}
        </Section.Content>
      </Section>

      <StructuredData data={structuredData} />
    </>
  )
}
