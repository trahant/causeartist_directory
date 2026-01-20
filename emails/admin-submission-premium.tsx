import "dotenv/config"

import { Text } from "@react-email/components"
import type { Tool } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { EmailButton } from "~/emails/components/button"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"

type EmailProps = EmailWrapperProps & {
  tool: Tool
}

export const EmailAdminSubmissionPremium = ({ tool, ...props }: EmailProps) => {
  return (
    <EmailWrapper {...props}>
      <Text>Hi!</Text>

      <Text>
        {tool.submitterName} has opted to {tool.isFeatured ? "feature" : "expedite"} the submission
        of {tool.name}. You should review and approve it as soon as possible.
      </Text>

      <EmailButton href={`${siteConfig.url}/admin/tools/${tool.id}`}>
        Review {tool.name}
      </EmailButton>
    </EmailWrapper>
  )
}

EmailAdminSubmissionPremium.PreviewProps = {
  to: "alex@example.com",
  tool: {
    id: "example-id",
    name: "Example Tool",
    slug: "example-tool",
    websiteUrl: "https://example.com",
    submitterName: "John Doe",
    publishedAt: null,
    status: "Draft",
  } as Tool,
} satisfies EmailProps

export default EmailAdminSubmissionPremium
