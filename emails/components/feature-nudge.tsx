import { Hr, Link, Text } from "@react-email/components"
import { type Tool } from "~/.generated/prisma/client"
import { siteConfig } from "~/config/site"
import { EmailButton } from "~/emails/components/button"
import { isToolPremiumTier } from "~/lib/tools"

type EmailFeatureNudgeProps = {
  tool: Tool
  showButton?: boolean
}

export const EmailFeatureNudge = ({ tool, showButton }: EmailFeatureNudgeProps) => {
  const link = `${siteConfig.url}/submit/${tool.slug}`

  const benefits = [
    "⏱️ Get published within 12 hours",
    "🔗 Get a do-follow link",
    "⭐ Featured on our homepage",
    "📌 Prominent placement in every listing",
    "✏️ Unlimited content updates",
  ]

  if (isToolPremiumTier(tool)) {
    return null
  }

  return (
    <>
      {showButton && <Hr />}

      <Text>
        Want to maximize {tool.name}'s visibility? Consider upgrading to{" "}
        <Link href={link}>our Featured plan</Link>. We offer a wide range of featuring options:
      </Text>

      <ul>
        {benefits.map(benefit => (
          <li key={benefit}>
            <Text className="m-0">{benefit}</Text>
          </li>
        ))}
      </ul>

      {showButton && <EmailButton href={link}>Boost {tool.name}'s visibility</EmailButton>}
    </>
  )
}
