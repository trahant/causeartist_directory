import type { Metadata } from "next"
import { Shell } from "~/components/admin/shell"
import { AIProvider } from "~/contexts/ai-context"
import { isAIEnabled } from "~/services/ai"

export const metadata: Metadata = {
  title: "Admin Panel",
}

export default function ({ children }: LayoutProps<"/admin">) {
  return (
    <AIProvider isAIEnabled={isAIEnabled}>
      <Shell>{children}</Shell>
    </AIProvider>
  )
}
