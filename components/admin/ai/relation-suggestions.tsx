import { useCompletion } from "@ai-sdk/react"
import { useDebouncedValue } from "@mantine/hooks"
import { isTruthy } from "@primoui/utils"
import { LoaderIcon, PlusIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatedContainer } from "~/components/common/animated-container"
import { Badge } from "~/components/common/badge"
import {
  type Relation,
  RelationSelector,
  type RelationSelectorProps,
} from "~/components/common/relation-selector"
import { Stack } from "~/components/common/stack"
import { Tooltip } from "~/components/common/tooltip"
import { useAI } from "~/contexts/ai-context"

type AIRelationSuggestionsProps<T> = RelationSelectorProps<T> & {
  prompt?: string
  maxSuggestions?: number
}

const buildSuggestionPrompt = (prompt: string, maxSuggestions: number, relationNames: string) => `
${prompt}

Only return the relation names in comma-separated format, and nothing else.
If there are no relevant relations, return an empty string.
Sort the relations by relevance to the link.
Suggest only ${maxSuggestions} relations at most.

Available relations: ${relationNames}
`

export const AIRelationSuggestions = <T extends Relation>({
  relations,
  ids,
  setIds,
  mapFunction,
  sortFunction,
  prompt,
  maxSuggestions = 5,
}: AIRelationSuggestionsProps<T>) => {
  const { isAIEnabled } = useAI()
  const [suggestions, setSuggestions] = useState<T[]>([])
  const [debouncedPrompt] = useDebouncedValue(prompt, 500)
  const requestedPromptRef = useRef<string | null>(null)

  const { complete, isLoading } = useCompletion({
    api: "/admin/api/ai/completion",
    onFinish: (_, completion) => {
      if (completion) {
        const suggestions = completion
          .split(",")
          .map(name => name.trim())
          .map(name => relations.find(c => c.name === name) || null)
          .filter((name, index, self) => self.indexOf(name) === index)
          .filter(isTruthy)
          .slice(0, maxSuggestions)

        setSuggestions(suggestions)
      }
    },
  })

  useEffect(() => {
    if (!suggestions.length) {
      requestedPromptRef.current = null
    }
  }, [suggestions])

  useEffect(() => {
    // Skip: not enabled or missing required data
    if (!isAIEnabled || !debouncedPrompt || !relations.length) return

    // Skip: user already has selections or suggestions
    if (ids.length || suggestions.length) return

    // Skip: request in progress or already requested this prompt
    if (isLoading || requestedPromptRef.current === debouncedPrompt) return

    // Make the request
    requestedPromptRef.current = debouncedPrompt
    const relationNames = relations.map(({ name }) => name).join(", ")
    complete(buildSuggestionPrompt(debouncedPrompt, maxSuggestions, relationNames))
  }, [debouncedPrompt, isAIEnabled, relations, ids, suggestions])

  const handleSetIds = useCallback(
    (newIds: string[]) => {
      setIds(newIds)

      if (newIds.length) {
        setSuggestions(prev => prev.filter(({ id }) => !newIds.includes(id)))
      } else {
        setSuggestions([])
      }
    },
    [setIds],
  )

  const getDisplayRelations = (relations: T[]): Relation[] => {
    return relations.map(relation => (mapFunction ? mapFunction(relation) : relation))
  }

  return (
    <RelationSelector
      relations={relations}
      ids={ids}
      setIds={handleSetIds}
      mapFunction={mapFunction}
      sortFunction={sortFunction}
    >
      {isAIEnabled && isLoading && (
        <AnimatedContainer height transition={{ ease: "linear", duration: 0.1 }}>
          <Stack size="xs" className="text-xs">
            <LoaderIcon className="animate-spin" />
            <span className="text-muted-foreground">Generating suggestions...</span>
          </Stack>
        </AnimatedContainer>
      )}

      {isAIEnabled && !!suggestions.length && (
        <AnimatedContainer height transition={{ ease: "linear", duration: 0.1 }}>
          <Stack size="sm" direction="row" className="items-start">
            <Tooltip tooltip="AI-suggested relations. Click on them to add to the selection.">
              <span className="mt-0.5 text-xs text-muted-foreground">Suggested:</span>
            </Tooltip>

            <Stack size="xs" className="flex-1">
              {getDisplayRelations(suggestions).map(relation => (
                <Badge key={relation.id} size="sm" variant="warning" prefix={<PlusIcon />} asChild>
                  <button type="button" onClick={() => handleSetIds(ids.concat(relation.id))}>
                    {relation.name}
                  </button>
                </Badge>
              ))}
            </Stack>
          </Stack>
        </AnimatedContainer>
      )}
    </RelationSelector>
  )
}
