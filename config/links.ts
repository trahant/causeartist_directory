import { siteConfig } from "~/config/site"

export const linksConfig = {
  author: "https://kulpinski.pl",
  builtWith: "https://dirstarter.com",
  github: "https://github.com/dirstarter/dirstarter",
  feeds: [
    { title: "RSS » Tools", url: `${siteConfig.url}/rss/tools.xml` },
    { title: "RSS » Blog Posts", url: `${siteConfig.url}/rss/posts.xml` },
  ],
}
