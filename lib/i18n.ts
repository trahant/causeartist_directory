import { getRequestConfig } from "next-intl/server"
import { defaultLocale as locale } from "~/lib/i18n-config"
import ads from "../messages/en/ads.json"
import brand from "../messages/en/brand.json"
import categories from "../messages/en/categories.json"
import common from "../messages/en/common.json"
import components from "../messages/en/components.json"
import directory from "../messages/en/directory.json"
import dialogs from "../messages/en/dialogs.json"
import forms from "../messages/en/forms.json"
import navigation from "../messages/en/navigation.json"
import pages from "../messages/en/pages.json"
import profiles from "../messages/en/profiles.json"
import posts from "../messages/en/posts.json"
import schema from "../messages/en/schema.json"
import tags from "../messages/en/tags.json"
import tools from "../messages/en/tools.json"

export default getRequestConfig(async () => {
  return {
    locale,
    messages: {
      ads,
      brand,
      categories,
      common,
      components,
      directory,
      dialogs,
      forms,
      navigation,
      pages,
      profiles,
      posts,
      schema,
      tags,
      tools,
    },
  }
})
