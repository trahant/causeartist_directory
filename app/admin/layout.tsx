import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Shell } from "~/components/admin/shell"
import { AIProvider } from "~/contexts/ai-context"
import { getServerSession } from "~/lib/auth"
import { isAIEnabled } from "~/services/ai"

export const metadata: Metadata = {
  title: "Admin Panel",
}

export default async function ({ children }: LayoutProps<"/admin">) {
  const session = await getServerSession()

  if (session?.user.role !== "admin") {
    redirect("/auth/login")
  }

  return (
    <AIProvider isAIEnabled={isAIEnabled}>
      <Shell>{children}</Shell>
    </AIProvider>
  )
}
