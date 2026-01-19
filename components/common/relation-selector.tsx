import { MousePointerClickIcon } from "lucide-react"
import type { PropsWithChildren, ReactNode } from "react"
import { AnimatedContainer } from "~/components/common/animated-container"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/common/command"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/common/popover"
import { Separator } from "~/components/common/separator"
import { Stack } from "~/components/common/stack"

export type Relation = {
  id: string
  name: ReactNode
}

export type RelationSelectorProps<T> = PropsWithChildren<{
  relations: T[]
  ids: string[]
  setIds: (ids: string[]) => void
  mapFunction?: (relation: T) => Relation
  sortFunction?: (a: T, b: T) => number
}>

export const RelationSelector = <T extends Relation>({
  children,
  relations,
  ids,
  setIds,
  mapFunction,
  sortFunction,
}: RelationSelectorProps<T>) => {
  const selectedRelations = relations?.filter(({ id }) => ids.includes(id))

  const handleFilter = (value: string, search: string) => {
    const normalizedValue = value.toLowerCase()
    const normalizedSearch = search.toLowerCase()
    return normalizedValue.includes(normalizedSearch) ? 1 : 0
  }

  const getDisplayRelations = (relations: T[], sort = false): Relation[] => {
    const sortedRelations = sort && sortFunction ? [...relations].sort(sortFunction) : relations
    return sortedRelations.map(relation => (mapFunction ? mapFunction(relation) : relation))
  }

  return (
    <Stack direction="column" className="w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            size="md"
            className="justify-start w-full px-3 gap-2.5"
            prefix={<MousePointerClickIcon />}
            suffix={
              <Badge variant="outline" className="ml-auto size-auto">
                {selectedRelations.length}
              </Badge>
            }
          >
            <Separator orientation="vertical" className="self-stretch" />

            <AnimatedContainer height transition={{ ease: "linear", duration: 0.1 }}>
              <Stack size="xs">
                {!selectedRelations.length && (
                  <span className="font-normal text-muted-foreground">Select</span>
                )}

                {getDisplayRelations(selectedRelations).map(relation => (
                  <Badge key={relation.id}>{relation.name}</Badge>
                ))}
              </Stack>
            </AnimatedContainer>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0" align="start">
          <Command filter={handleFilter}>
            <CommandInput placeholder="Search..." />

            <CommandList className="min-w-72 w-(--radix-popper-anchor-width)">
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {getDisplayRelations(relations, true).map(relation => {
                  const isSelected = ids.includes(relation.id)

                  return (
                    <CommandItem
                      key={relation.id}
                      onSelect={() => {
                        setIds(
                          isSelected ? ids.filter(id => id !== relation.id) : [...ids, relation.id],
                        )
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="pointer-events-none"
                      />

                      <Stack wrap={false} className="flex-1 justify-between truncate">
                        {relation.name}
                      </Stack>
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {!!ids.length && (
                <div className="p-1 border-t sticky -bottom-px bg-background">
                  <Button size="md" variant="ghost" onClick={() => setIds([])} className="w-full">
                    Clear selection
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {children}
    </Stack>
  )
}
