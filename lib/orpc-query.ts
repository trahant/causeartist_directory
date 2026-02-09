import { createRouterUtils } from "@orpc/tanstack-query"
import { client } from "~/lib/orpc-client"

export const orpc = createRouterUtils(client)
