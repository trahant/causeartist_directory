#!/usr/bin/env node
import { db } from "~/services/db"

const FROM = "__GHOST_URL__"
const TO = "https://www.causeartist.com"

function replaceGhostUrl(value: string): string {
  return value.replaceAll(FROM, TO)
}

async function fixBlogPosts() {
  let updated = 0

  const posts = await db.blogPost.findMany({
    select: { id: true, content: true, heroImageUrl: true },
  })

  for (const post of posts) {
    try {
      const hasContent = !!post.content && post.content.includes(FROM)
      const hasHero = !!post.heroImageUrl && post.heroImageUrl.includes(FROM)
      if (!hasContent && !hasHero) continue

      const nextContent = post.content ? replaceGhostUrl(post.content) : post.content
      const nextHero = post.heroImageUrl ? replaceGhostUrl(post.heroImageUrl) : post.heroImageUrl

      await db.blogPost.update({
        where: { id: post.id },
        data: { content: nextContent, heroImageUrl: nextHero },
      })

      updated++
      console.log("Updated BlogPost:", post.id)
    } catch (e) {
      console.error("Error updating BlogPost:", post.id, e)
    }
  }

  return updated
}

async function fixPodcastEpisodes() {
  let updated = 0

  const episodes = await db.podcastEpisode.findMany({
    select: { id: true, content: true, heroImageUrl: true },
  })

  for (const episode of episodes) {
    try {
      const hasContent = !!episode.content && episode.content.includes(FROM)
      const hasHero = !!episode.heroImageUrl && episode.heroImageUrl.includes(FROM)
      if (!hasContent && !hasHero) continue

      const nextContent = episode.content ? replaceGhostUrl(episode.content) : episode.content
      const nextHero = episode.heroImageUrl
        ? replaceGhostUrl(episode.heroImageUrl)
        : episode.heroImageUrl

      await db.podcastEpisode.update({
        where: { id: episode.id },
        data: { content: nextContent, heroImageUrl: nextHero },
      })

      updated++
      console.log("Updated PodcastEpisode:", episode.id)
    } catch (e) {
      console.error("Error updating PodcastEpisode:", episode.id, e)
    }
  }

  return updated
}

async function fixCaseStudies() {
  let updated = 0

  const caseStudies = await db.caseStudy.findMany({
    select: { id: true, content: true, heroImageUrl: true },
  })

  for (const caseStudy of caseStudies) {
    try {
      const hasContent = !!caseStudy.content && caseStudy.content.includes(FROM)
      const hasHero = !!caseStudy.heroImageUrl && caseStudy.heroImageUrl.includes(FROM)
      if (!hasContent && !hasHero) continue

      const nextContent = caseStudy.content
        ? replaceGhostUrl(caseStudy.content)
        : caseStudy.content
      const nextHero = caseStudy.heroImageUrl
        ? replaceGhostUrl(caseStudy.heroImageUrl)
        : caseStudy.heroImageUrl

      await db.caseStudy.update({
        where: { id: caseStudy.id },
        data: { content: nextContent, heroImageUrl: nextHero },
      })

      updated++
      console.log("Updated CaseStudy:", caseStudy.id)
    } catch (e) {
      console.error("Error updating CaseStudy:", caseStudy.id, e)
    }
  }

  return updated
}

async function fixGlossaryTerms() {
  let updated = 0

  const terms = await db.glossaryTerm.findMany({
    select: { id: true, definition: true },
  })

  for (const term of terms) {
    try {
      const hasDefinition = !!term.definition && term.definition.includes(FROM)
      if (!hasDefinition) continue

      const nextDefinition = term.definition ? replaceGhostUrl(term.definition) : term.definition

      await db.glossaryTerm.update({
        where: { id: term.id },
        data: { definition: nextDefinition },
      })

      updated++
      console.log("Updated GlossaryTerm:", term.id)
    } catch (e) {
      console.error("Error updating GlossaryTerm:", term.id, e)
    }
  }

  return updated
}

async function main() {
  console.log(`Replacing ${FROM} -> ${TO}`)

  const blogPostsUpdated = await fixBlogPosts()
  const podcastEpisodesUpdated = await fixPodcastEpisodes()
  const caseStudiesUpdated = await fixCaseStudies()
  const glossaryTermsUpdated = await fixGlossaryTerms()

  console.log("\n--- Totals ---")
  console.log("BlogPosts updated:", blogPostsUpdated)
  console.log("PodcastEpisodes updated:", podcastEpisodesUpdated)
  console.log("CaseStudies updated:", caseStudiesUpdated)
  console.log("GlossaryTerms updated:", glossaryTermsUpdated)
}

main().then(
  () => process.exit(0),
  e => {
    console.error(e)
    process.exit(1)
  },
)

