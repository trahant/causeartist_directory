import { differenceInDays } from "date-fns"
import { type Tool } from "~/.generated/prisma/browser"
import { submissionsConfig } from "~/config/submissions"

/**
 * Check if a tool is published.
 *
 * @param tool - The tool to check.
 * @returns Whether the tool is published.
 */
export const isToolPublished = (tool: Pick<Tool, "status">) => {
  return ["Published"].includes(tool.status)
}

/**
 * Check if a tool is scheduled.
 *
 * @param tool - The tool to check.
 * @returns Whether the tool is scheduled.
 */
export const isToolScheduled = (tool: Pick<Tool, "status">) => {
  return ["Scheduled"].includes(tool.status)
}

/**
 * Check if a tool is approved (scheduled or published)
 *
 * @param tool - The tool to check.
 * @returns Whether the tool is published.
 */
export const isToolApproved = (tool: Pick<Tool, "status">) => {
  return ["Scheduled", "Published"].includes(tool.status)
}

/**
 * Check if a tool is within the expedite threshold.
 *
 * @param tool - The tool to check.
 * @returns Whether the tool is within the expedite threshold.
 */
export const isToolWithinExpediteThreshold = (tool: Pick<Tool, "publishedAt">) => {
  const threshold = submissionsConfig.expediteThreshold

  return tool.publishedAt && differenceInDays(tool.publishedAt, new Date()) < threshold
}

/**
 * Check if a tool has at least Standard tier.
 *
 * @param tool - The tool to check.
 * @returns Whether the tool has at least Standard tier.
 */
export const isToolStandardTier = (tool: Pick<Tool, "tier">) => {
  return ["Standard", "Premium"].includes(tool.tier)
}

/**
 * Check if a tool has Premium tier.
 *
 * @param tool - The tool to check.
 * @returns Whether the tool has Premium tier.
 */
export const isToolPremiumTier = (tool: Pick<Tool, "tier">) => {
  return ["Premium"].includes(tool.tier)
}
