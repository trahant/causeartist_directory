import { useLocalStorage } from "@mantine/hooks"
import { LoaderIcon, SparklesIcon } from "lucide-react"
import { type ComponentProps, useState } from "react"
import { Button } from "~/components/common/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/common/dialog"
import { Tooltip } from "~/components/common/tooltip"
import { siteConfig } from "~/config/site"
import { useAI } from "~/contexts/ai-context"

type AIGenerateProps = ComponentProps<typeof Button> & {
  stop: () => void
  isLoading: boolean
  buttonText?: string
  onGenerate: () => void
}

export const AIGenerate = ({
  stop,
  isLoading,
  buttonText,
  onGenerate,
  ...props
}: AIGenerateProps) => {
  const { isAIEnabled } = useAI()
  const key = siteConfig.slug
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [consent, setConsent] = useLocalStorage({ key: `${key}-ai-consent`, defaultValue: false })

  if (!isAIEnabled) {
    return (
      <Tooltip tooltip="AI features are not configured. Set AI_GATEWAY_API_KEY to enable.">
        <Button type="button" variant="secondary" size="md" prefix={<SparklesIcon />} disabled>
          <span className="max-md:sr-only">{buttonText || "Generate"}</span>
        </Button>
      </Tooltip>
    )
  }

  const handleGenerate = (force = false) => {
    if (!consent && !force) {
      setIsAlertOpen(true)
      return
    }

    setIsAlertOpen(false)
    setConsent(true)

    // Generate content
    onGenerate()
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="md"
        prefix={isLoading ? <LoaderIcon className="animate-spin" /> : <SparklesIcon />}
        onClick={() => (isLoading ? stop() : handleGenerate())}
        {...props}
      >
        <span className="max-md:sr-only">
          {isLoading ? "Stop Generating" : buttonText || "Generate"}
        </span>
      </Button>

      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Before you continue</DialogTitle>

            <DialogDescription>
              <p>
                This action will automatically generate content for you. The process will take some
                time to complete.
              </p>
              <p>
                Please note that this will <strong>overwrite any existing content</strong> you have
                entered and may also incur an <strong>AI usage fee</strong>.
              </p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button size="md" variant="secondary">
                Cancel
              </Button>
            </DialogClose>

            <Button size="md" onClick={() => handleGenerate(true)}>
              Ok, I understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
