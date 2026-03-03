import { addDays } from "date-fns"
import { PostStatus, ToolStatus, ToolTier } from "~/.generated/prisma/client"
import { db } from "~/services/db"

const ADMIN_EMAIL = "admin@dirstarter.com"
const USER_EMAIL = "user@dirstarter.com"

const DUMMY_CONTENT = `This tool has revolutionized the way developers approach modern software development. With its **intuitive interface** and powerful features, it streamlines workflows and enhances productivity across teams of all sizes. Whether you're a beginner just starting your development journey or an experienced professional working on complex enterprise applications, this tool provides the flexibility and reliability you need to succeed.

The platform offers a **comprehensive suite of features** designed to meet the diverse needs of today's development landscape. From advanced code editing capabilities to seamless integration with popular development tools and services, every aspect has been carefully crafted to provide an exceptional user experience. The robust plugin ecosystem further extends functionality, allowing teams to customize their workflow according to specific project requirements.

Setting up and getting started is remarkably straightforward, with detailed documentation and **community support** available to guide you through the process. The active community contributes to a wealth of tutorials, best practices, and real-world examples that help accelerate your learning curve. Regular updates and improvements ensure that you're always working with the latest features and security enhancements.`

async function main() {
  const now = new Date()

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

  // Create categories
  await db.category.createMany({
    data: [
      {
        name: "Frontend",
        slug: "frontend",
        label: "Frontend Development",
        description: "Tools for building the user interface of a website or application.",
      },
      {
        name: "Backend",
        slug: "backend",
        label: "Backend Development",
        description: "Tools for building the server-side of a website or application.",
      },
      {
        name: "DevOps",
        slug: "devops",
        label: "DevOps & Deployment",
        description: "Tools for deploying and managing applications.",
      },
      {
        name: "Design Tools",
        slug: "design-tools",
        label: "Design & UI/UX",
        description: "Tools for designing and creating user interfaces.",
      },
      {
        name: "Productivity",
        slug: "productivity",
        label: "Productivity Tools",
        description: "Tools for increasing productivity and efficiency.",
      },
      {
        name: "Testing",
        slug: "testing",
        label: "Testing & QA",
        description: "Tools for testing and quality assurance.",
      },
      {
        name: "Learning",
        slug: "learning",
        label: "Learning Resources",
        description: "Tools for learning and improving skills.",
      },
      {
        name: "AI Tools",
        slug: "ai-tools",
        label: "AI & Machine Learning",
        description: "Tools for using AI and machine learning.",
      },
    ],
  })

  console.log("Created categories")

  // Create tags
  await db.tag.createMany({
    data: [
      { name: "React", slug: "react" },
      { name: "Vue", slug: "vue" },
      { name: "Angular", slug: "angular" },
      { name: "Svelte", slug: "svelte" },
      { name: "Node.js", slug: "nodejs" },
      { name: "Python", slug: "python" },
      { name: "TypeScript", slug: "typescript" },
      { name: "JavaScript", slug: "javascript" },
      { name: "CSS", slug: "css" },
      { name: "HTML", slug: "html" },
      { name: "Rust", slug: "rust" },
      { name: "Go", slug: "go" },
      { name: "AWS", slug: "aws" },
      { name: "Docker", slug: "docker" },
      { name: "Kubernetes", slug: "kubernetes" },
      { name: "CI/CD", slug: "ci-cd" },
      { name: "Free", slug: "free" },
      { name: "Paid", slug: "paid" },
      { name: "Open Source", slug: "open-source" },
      { name: "AI", slug: "ai" },
      { name: "API", slug: "api" },
    ],
  })

  console.log("Created tags")

  // Create tools
  const toolsData = [
    {
      name: "VS Code",
      slug: "vscode",
      websiteUrl: "https://code.visualstudio.com",
      tagline: "Free source-code editor made by Microsoft",
      description:
        "Visual Studio Code is a lightweight but powerful source code editor with support for many programming languages through extensions.",
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl: "https://code.visualstudio.com/opengraphimg/opengraph-home.png",
      categories: ["frontend"],
      tags: ["free", "open-source"],
      owner: { connect: { email: "admin@dirstarter.com" } },
    },
    {
      name: "Next.js",
      slug: "nextjs",
      websiteUrl: "https://nextjs.org",
      tagline: "The full-stack React framework for the web",
      description:
        "Next.js gives you the best developer experience with all the features you need for production: hybrid static & server rendering, TypeScript support, smart bundling, route pre-fetching, and more.",
      tier: ToolTier.Premium,
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl: "https://assets.vercel.com/image/upload/front/nextjs/twitter-card.png",
      categories: ["frontend"],
      tags: ["typescript", "javascript", "free", "open-source"],
    },
    {
      name: "Docker",
      slug: "docker",
      websiteUrl: "https://www.docker.com",
      tagline: "Accelerate how you build, share and run modern applications",
      description:
        "Docker is an open platform for developing, shipping, and running applications in containers.",
      tier: ToolTier.Premium,
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl: "https://www.docker.com/app/uploads/2023/06/meta-image-homepage-1110x580.png",
      categories: ["devops"],
      tags: ["docker", "free", "open-source"],
    },
    {
      name: "Figma",
      slug: "figma",
      websiteUrl: "https://www.figma.com",
      tagline: "Design, prototype, and collaborate all in the browser",
      description:
        "Figma is a vector graphics editor and prototyping tool, primarily web-based with additional offline features through desktop applications.",
      tier: ToolTier.Premium,
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl:
        "https://cdn.sanity.io/images/599r6htc/regionalized/1adfa5a99040c80af7b4b5e3e2cf845315ea2367-2400x1260.png?w=1200&q=70&fit=max&auto=format",
      categories: ["design-tools"],
      tags: ["free", "paid"],
    },
    {
      name: "Node.js",
      slug: "nodejs",
      websiteUrl: "https://nodejs.org",
      tagline: "JavaScript runtime built on Chrome's V8 JavaScript engine",
      description:
        "Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser.",
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl:
        "https://nodejs.org/en/next-data/og/announcement/Node.js%20%E2%80%94%20Run%20JavaScript%20Everywhere",
      categories: ["backend"],
      tags: ["nodejs", "javascript", "free", "open-source"],
    },
    {
      name: "Claude",
      slug: "claude",
      websiteUrl: "https://claude.ai",
      tagline: "Advanced AI assistant for coding and analysis",
      description:
        "Claude is an AI assistant by Anthropic that excels at coding, analysis, and creative tasks. It can help with code review, debugging, and explaining complex concepts.",
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl: "https://claude.ai/images/claude_ogimage.png",
      categories: ["productivity", "ai-tools"],
      tags: ["paid", "ai"],
    },
    {
      name: "Jest",
      slug: "jest",
      websiteUrl: "https://jestjs.io",
      tagline: "Delightful JavaScript Testing",
      description:
        "Jest is a JavaScript testing framework designed to ensure correctness of any JavaScript codebase.",
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl: "https://jestjs.io/img/opengraph.png",
      categories: ["testing"],
      tags: ["typescript", "javascript", "free", "open-source"],
    },
    {
      name: "AWS",
      slug: "aws",
      websiteUrl: "https://aws.amazon.com",
      tagline: "The most comprehensive and broadly adopted cloud platform",
      description:
        "Amazon Web Services offers reliable, scalable, and inexpensive cloud computing services.",
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl: "https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png",
      categories: ["devops"],
      tags: ["aws", "paid"],
    },
    {
      name: "MDN Web Docs",
      slug: "mdn-web-docs",
      websiteUrl: "https://developer.mozilla.org",
      tagline: "Resources for developers, by developers",
      description:
        "MDN Web Docs is an open-source, collaborative project documenting Web platform technologies.",
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl: "https://developer.mozilla.org/mdn-social-share.d893525a4fb5fb1f67a2.png",
      categories: ["learning"],
      tags: ["javascript", "css", "html", "free", "open-source"],
    },
    {
      name: "ChatGPT",
      slug: "chatgpt",
      websiteUrl: "https://chatgpt.com",
      tagline: "A conversational AI system that listens, learns, and challenges",
      description:
        "ChatGPT is a large language model developed by OpenAI that can generate human-like text based on the context and prompt it's given.",
      tier: ToolTier.Premium,
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl: "https://cdn.oaistatic.com/assets/chatgpt-share-og-u7j5uyao.webp",
      categories: ["ai-tools", "productivity"],
      tags: ["free", "paid", "ai"],
    },
    {
      name: "Tailwind CSS",
      slug: "tailwind-css",
      websiteUrl: "https://tailwindcss.com",
      tagline: "A utility-first CSS framework for rapid UI development",
      description:
        "Tailwind CSS is a utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.",
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl: "https://tailwindcss.com/opengraph-image.jpg",
      categories: ["frontend"],
      tags: ["css", "free", "open-source"],
    },
    {
      name: "React",
      slug: "react",
      websiteUrl: "https://react.dev",
      tagline: "The library for web and native user interfaces",
      description:
        "React is a JavaScript library for building user interfaces, particularly single-page applications.",
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl: "https://react.dev/images/og-home.png",
      categories: ["frontend"],
      tags: ["react", "javascript", "free", "open-source"],
    },
    {
      name: "Postman",
      slug: "postman",
      websiteUrl: "https://www.postman.com",
      tagline: "API platform for building and using APIs",
      description:
        "Postman is an API platform for developers to design, build, test and iterate their APIs.",
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl:
        "https://voyager.postman.com/social-preview/postman-api-platform-social-preview-2.jpeg",
      categories: ["testing", "backend"],
      tags: ["free", "paid", "api"],
    },
    {
      name: "GitHub",
      slug: "github",
      websiteUrl: "https://github.com",
      tagline: "Build and ship software on a single, collaborative platform",
      description:
        "GitHub is a code hosting platform for version control and collaboration, letting you and others work together on projects.",
      tier: ToolTier.Premium,
      status: ToolStatus.Published,
      publishedAt: now,
      screenshotUrl:
        "https://github.githubassets.com/images/modules/site/social-cards/github-social.png",
      categories: ["devops"],
      tags: ["free", "paid", "open-source", "ci-cd"],
    },
    {
      name: "SvelteKit",
      slug: "sveltekit",
      websiteUrl: "https://svelte.dev",
      tagline: "The fastest way to build Svelte apps",
      description:
        "SvelteKit is a framework for building web applications of all sizes, with a beautiful development experience and flexible filesystem-based routing.",
      status: ToolStatus.Scheduled,
      publishedAt: addDays(now, 7),
      screenshotUrl: "https://svelte.dev/images/twitter-thumbnail.jpg",
      categories: ["frontend"],
      tags: ["svelte", "javascript", "free", "open-source"],
      owner: { connect: { email: "admin@dirstarter.com" } },
    },
    {
      name: "Rust",
      slug: "rust",
      websiteUrl: "https://www.rust-lang.org",
      tagline: "A language empowering everyone to build reliable and efficient software",
      description:
        "Rust is a multi-paradigm, general-purpose programming language designed for performance and safety, especially safe concurrency.",
      status: ToolStatus.Draft,
      screenshotUrl: "https://www.rust-lang.org/static/images/rust-social-wide.jpg",
      categories: ["backend"],
      tags: ["rust", "free", "open-source"],
      owner: { connect: { email: "admin@dirstarter.com" } },
    },
    {
      name: "Kubernetes",
      slug: "kubernetes",
      websiteUrl: "https://kubernetes.io",
      tagline: "Production-Grade Container Orchestration",
      description:
        "Kubernetes is an open-source container orchestration platform for automating deployment, scaling, and management of containerized applications.",
      status: ToolStatus.Draft,
      screenshotUrl: "https://kubernetes.io/images/kubernetes-open-graph.png",
      categories: ["devops"],
      tags: ["kubernetes", "free", "open-source"],
      owner: { connect: { email: "admin@dirstarter.com" } },
    },
  ]

  // Create tools with their relationships
  for (const { categories, tags, ...toolData } of toolsData) {
    await db.tool.create({
      data: {
        ...toolData,
        content: DUMMY_CONTENT,
        faviconUrl: `https://www.google.com/s2/favicons?sz=128&domain_url=${toolData.websiteUrl}`,
        categories: { connect: categories.map(slug => ({ slug })) },
        tags: { connect: tags.map(slug => ({ slug })) },
      },
    })
  }

  console.log("Created tools")

  // Create blog posts
  const admin = await db.user.findFirstOrThrow({ where: { email: ADMIN_EMAIL } })

  const boilerplateContent = `Building a directory website from scratch is a time-consuming endeavor. Between setting up authentication, payment processing, admin panels, SEO optimization, and content management, months can fly by before you even launch. That's exactly why we built Dirstarter – a comprehensive Next.js boilerplate that handles all the technical complexity so you can focus on growing your business.

## What Makes Dirstarter Different?

Dirstarter isn't just another template. It's a battle-tested, production-ready foundation that combines the latest web technologies with real-world business logic. Built on Next.js 15 with React 19, TypeScript, and Prisma ORM, it provides everything you need to launch a profitable directory website.

### Built for Monetization

The biggest challenge with directory websites isn't building them – it's making them profitable. Dirstarter comes with multiple revenue streams built-in:

1. **Featured Listings** - Spotlight premium tools at the top of your directory
2. **Sponsored Content** - Flexible ad placement system
3. **Premium Submissions** - Charge for expedited submissions and featured listings

## Technical Excellence Out of the Box

Dirstarter leverages modern web technologies to ensure your directory is fast, scalable, and maintainable.

### Performance First

- **SEO Optimized**: Structured data, sitemap generation, and semantic HTML
- **Lightning Fast**: Server-side rendering with intelligent caching strategies
- **Global Ready**: Multi-language support with next-intl
- **Mobile Optimized**: Responsive design that works beautifully on all devices

## Getting Started Is Easy

The entire setup process takes less than an hour, and you'll have a fully functional directory website ready to accept submissions and process payments.`

  await db.post.create({
    data: {
      title: "Why Dirstarter is the Ultimate Next.js Boilerplate for Directory Websites",
      slug: "boilerplate",
      description:
        "Discover how Dirstarter helps you launch profitable directory websites in days, not months. Built with Next.js 15, TypeScript, and everything you need to monetize from day one.",
      content: boilerplateContent,
      plainText: boilerplateContent,
      imageUrl: "/content/boilerplate.webp",
      status: PostStatus.Published,
      publishedAt: new Date("2025-11-13"),
      authorId: admin.id,
    },
  })

  const contentStrategyContent = `Content marketing is essential for directory websites, but publishing without a clear process leads to inconsistent results. Dirstarter helps you standardize your content workflow so every post supports both discoverability and conversion goals.

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
      title: "Content Strategy for Directory Websites with Dirstarter",
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
