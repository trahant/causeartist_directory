import "dotenv/config"

import { Text } from "@react-email/components"
import { type Tool } from "~/.generated/prisma/client"
import { EmailFeatureNudge } from "~/emails/components/feature-nudge"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"
import { isToolPremiumTier, isToolPublished } from "~/lib/tools"

type EmailProps = EmailWrapperProps & {
  tool: Tool
}

export const EmailSubmissionPremium = ({ tool, ...props }: EmailProps) => {
  return (
    <EmailWrapper {...props}>
      <Text>Hey {tool.submitterName?.trim()}!</Text>

      {isToolPremiumTier(tool) ? (
        tool.publishedAt && isToolPublished(tool) ? (
          <Text>
            Thanks for featuring {tool.name}, it should soon be displayed at a prominent place on
            our listings. If that's not the case, please clear your cache and refresh the page.
          </Text>
        ) : (
          <Text>
            Thanks for featuring {tool.name}, it will now be reviewed and added to our directory{" "}
            <strong>within 12 hours</strong>. If you want your tool published on a specific date,
            please let us know. We'll do our best to meet your request.
          </Text>
        )
      ) : (
        <>
          <Text>
            Thanks for submitting {tool.name}, it will now be reviewed and added to our directory{" "}
            <strong>within 24 hours</strong>. If you want your tool published on a specific date,
            please let us know. We'll do our best to meet your request.
          </Text>

          <EmailFeatureNudge tool={tool} showButton />
        </>
      )}
    </EmailWrapper>
  )
}

EmailSubmissionPremium.PreviewProps = {
  to: "alex@example.com",
  tool: {
    name: "Example Tool",
    slug: "example-tool",
    websiteUrl: "https://example.com",
    submitterName: "John Doe",
    publishedAt: null,
    status: "Draft",
  } as Tool,
} satisfies EmailProps

export default EmailSubmissionPremium
