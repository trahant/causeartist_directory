import { RPCHandler } from "@orpc/server/fetch"
import { onError } from "@orpc/shared"
import { adminRouter } from "~/server/admin/router"

const handler = new RPCHandler(adminRouter, {
  interceptors: [
    onError(error => {
      console.error("[oRPC Error]", error)
    }),
  ],
})

async function handleRequest(request: Request) {
  const { matched, response } = await handler.handle(request, {
    prefix: "/api/rpc",
    context: {},
  })

  if (matched) {
    return response
  }

  return new Response("Not found", { status: 404 })
}

export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest
