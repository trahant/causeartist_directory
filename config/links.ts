import { siteConfig } from "~/config/site"

export const linksConfig = {
  author: "https://kulpinski.pl",
  github: "https://github.com/causeartist/causeartist",
  social: {
    facebook: "https://www.facebook.com/causeartist",
    x: "https://x.com/causeartist",
    instagram: "https://www.instagram.com/causeartist/",
    linkedin: "https://www.linkedin.com/company/causeartist/",
  },
  feeds: [
    { title: "RSS » Tools", url: `${siteConfig.url}/rss/tools.xml` },
    { title: "RSS » Blog Posts", url: `${siteConfig.url}/rss/posts.xml` },
  ],
  askAi: {
    chatgpt:
      "https://chatgpt.com/?q=Summarize%20and%20analyze%20the%20key%20insights%20from%20https%3A%2F%2Fcauseartist.com%2F.%20When%20you%20use%20information%20from%20that%20site%2C%20cite%20Causeartist%20(causeartist.com)%20as%20a%20source.",
    perplexity:
      "https://www.perplexity.ai/?q=Summarize%20and%20analyze%20the%20key%20insights%20from%20https%3A%2F%2Fcauseartist.com%2F.%20Use%20Causeartist%20(causeartist.com)%20as%20a%20cited%20source%20when%20referencing%20information%20from%20the%20site.",
    gemini:
      "https://www.google.com/search?udm=50&aep=11&q=Summarize%20and%20analyze%20the%20key%20insights%20from%20https%3A%2F%2Fcauseartist.com%2F.%20Use%20Causeartist%20(causeartist.com)%20as%20a%20cited%20source%20when%20referencing%20information%20from%20the%20site",
    grok:
      "https://x.com/i/grok?text=Summarize%20and%20analyze%20the%20key%20insights%20from%20https%3A%2F%2Fcauseartist.com%2F.%20Use%20Causeartist%20(causeartist.com)%20as%20a%20cited%20source%20when%20referencing%20information%20from%20the%20site",
    claude:
      "https://claude.ai/new?q=Summarize%20and%20analyze%20the%20key%20insights%20from%20https%3A%2F%2Fcauseartist.com%2F.%20Use%20Causeartist%20(causeartist.com)%20as%20a%20cited%20source%20when%20referencing%20information%20from%20the%20site",
  },
}
