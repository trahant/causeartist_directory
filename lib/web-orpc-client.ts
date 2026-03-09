import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import type { WebRouter } from "~/server/web/router"

const link = new RPCLink({
  url: () => {
    if (typeof window === "undefined") {
      throw new Error("RPCLink should only be used on the client side.")
    }

    return `${window.location.origin}/api/web-rpc`
  },
  fetch: (request, init) => {
    return globalThis.fetch(request, {
      ...init,
      credentials: "include",
    })
  },
})

export const webClient: RouterClient<WebRouter> = createORPCClient(link)
