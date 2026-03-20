import { PostStatus } from "~/.generated/prisma/client"
import { db } from "~/services/db"

const ADMIN_EMAIL = "admin@causeartist.com"
const USER_EMAIL = "user@causeartist.com"

async function main() {
  console.log("Starting seeding...")

  await db.user.createMany({
    data: [
      {
        name: "Admin User",
        email: ADMIN_EMAIL,
        emailVerified: true,
        role: "admin",
      },
      {
        name: "User",
        email: USER_EMAIL,
        emailVerified: true,
        role: "user",
      },
    ],
  })

  console.log("Created users")

  const admin = await db.user.findFirstOrThrow({ where: { email: ADMIN_EMAIL } })

  const boilerplateContent = `Building a directory website from scratch is a time-consuming endeavor. Between setting up authentication, payment processing, admin panels, SEO optimization, and content management, months can fly by before you even launch. That's exactly why we built Causeartist – a comprehensive Next.js boilerplate that handles all the technical complexity so you can focus on growing your business.

## What Makes Causeartist Different?

Causeartist isn't just another template. It's a battle-tested, production-ready foundation that combines the latest web technologies with real-world business logic. Built on Next.js 15 with React 19, TypeScript, and Prisma ORM, it provides everything you need to launch a profitable directory website.

### Built for Monetization

The biggest challenge with directory websites isn't building them – it's making them profitable. Causeartist comes with multiple revenue streams built-in:

1. **Featured Listings** - Spotlight premium tools at the top of your directory
2. **Sponsored Content** - Flexible ad placement system
3. **Premium Submissions** - Charge for expedited submissions and featured listings

## Technical Excellence Out of the Box

Causeartist leverages modern web technologies to ensure your directory is fast, scalable, and maintainable.

### Performance First

- **SEO Optimized**: Structured data, sitemap generation, and semantic HTML
- **Lightning Fast**: Server-side rendering with intelligent caching strategies
- **Global Ready**: Multi-language support with next-intl
- **Mobile Optimized**: Responsive design that works beautifully on all devices

## Getting Started Is Easy

The entire setup process takes less than an hour, and you'll have a fully functional directory website ready to accept submissions and process payments.`

  await db.post.create({
    data: {
      title: "Why Causeartist is the Ultimate Next.js Boilerplate for Directory Websites",
      slug: "boilerplate",
      description:
        "Discover how Causeartist helps you launch profitable directory websites in days, not months. Built with Next.js 15, TypeScript, and everything you need to monetize from day one.",
      content: boilerplateContent,
      plainText: boilerplateContent,
      imageUrl: "/content/boilerplate.webp",
      status: PostStatus.Published,
      publishedAt: new Date("2025-11-13"),
      authorId: admin.id,
    },
  })

  const contentStrategyContent = `Content marketing is essential for directory websites, but publishing without a clear process leads to inconsistent results. Causeartist helps you standardize your content workflow so every post supports both discoverability and conversion goals.

## Why This Strategy Matters

Great directory content should educate readers while moving them toward high-intent actions. A repeatable strategy helps you do that without reinventing your process for every article:

- **Keeping Readers Focused**: Use clear article structure and actionable takeaways so readers stay engaged from introduction to conclusion
- **Building Consistency**: Create reusable templates for intros, sections, and CTAs to publish at a steady cadence
- **Strengthening SEO Foundations**: Target search intent, improve on-page structure, and update high-potential posts regularly

## Best Practices

Treat each post like a product asset: define the user problem, provide practical guidance, and end with a clear next step. This keeps your blog useful and commercially aligned.

A disciplined content strategy turns your blog into a reliable acquisition channel that compounds over time and supports long-term directory growth.`

  await db.post.create({
    data: {
      title: "Content Strategy for Directory Websites with Causeartist",
      slug: "content-strategy",
      description:
        "Learn a practical framework to plan, write, and distribute blog content that grows your directory website.",
      content: contentStrategyContent,
      plainText: contentStrategyContent,
      imageUrl: "/content/content-strategy.webp",
      status: PostStatus.Published,
      publishedAt: new Date("2026-01-01"),
      authorId: admin.id,
    },
  })

  console.log("Created blog posts")

  await db.company.createMany({
    data: [
      {
        name: "Acme Impact",
        slug: "acme-impact",
        status: "published",
        tagline: "Building a better world through sustainable innovation.",
      },
      {
        name: "Green Future Co",
        slug: "green-future-co",
        status: "published",
        tagline: "Climate solutions for the next decade.",
      },
      {
        name: "Social Good Labs",
        slug: "social-good-labs",
        status: "published",
        tagline: "Technology that serves people and planet.",
      },
    ],
  })
  console.log("Created companies")

  await db.funder.createMany({
    data: [
      { name: "Impact Ventures", slug: "impact-ventures", status: "published", type: "vc" },
      { name: "Cause Foundation", slug: "cause-foundation", status: "published", type: "foundation" },
    ],
  })
  console.log("Created funders")

  console.log("Seeding completed!")
}

main()
  .catch(e => {
    console.error("Error during seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
