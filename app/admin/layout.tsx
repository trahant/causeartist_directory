import type { Metadata } from "next"
import { QueryProvider } from "~/components/admin/providers/query-provider"
import { Shell } from "~/components/admin/shell"
import { AIProvider } from "~/contexts/ai-context"
import { isAIEnabled } from "~/services/ai"

export const metadata: Metadata = {
  title: "Admin Panel",
}

export default function ({ children }: LayoutProps<"/admin">) {
  return (
    <QueryProvider>
      <AIProvider isAIEnabled={isAIEnabled}>
        <Shell>{children}</Shell>
      </AIProvider>
    </QueryProvider>
  )
}
