import { createRouterUtils } from "@orpc/tanstack-query"
import { webClient } from "~/lib/web-orpc-client"

export const webOrpc = createRouterUtils(webClient)
