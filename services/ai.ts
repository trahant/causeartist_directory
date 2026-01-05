import { createGateway } from "ai"
import { siteConfig } from "~/config/site"
import { env } from "~/env"

export const isAIEnabled = !!env.AI_GATEWAY_API_KEY

export const gateway = createGateway({
  headers: {
    "http-referer": siteConfig.url,
    "x-title": siteConfig.name,
  },
})

export const getChatModel = () => gateway(env.AI_CHAT_MODEL)
export const getCompletionModel = () => gateway(env.AI_COMPLETION_MODEL)
