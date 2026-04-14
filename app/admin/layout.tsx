import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Shell } from "~/components/admin/shell"
import { AIProvider } from "~/contexts/ai-context"
import { auth } from "~/lib/auth"
import { isAIEnabled } from "~/services/ai"

export const metadata: Metadata = {
  title: "Admin Panel",
}

export const dynamic = "force-dynamic"

export default async function ({ children }: LayoutProps<"/admin">) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "admin") {
    redirect("/")
  }

  return (
    <AIProvider isAIEnabled={isAIEnabled}>
      <Shell>{children}</Shell>
    </AIProvider>
  )
}
