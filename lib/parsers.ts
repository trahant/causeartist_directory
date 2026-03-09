import type { Row } from "@tanstack/react-table"
import type { inferParserType, ParserMap } from "nuqs"
import { createParser, parseAsString } from "nuqs/server"
import { z } from "zod"
import type { ExtendedSortingState } from "~/types"

type SortDefinition<TOrderBy> = {
  label: string
  orderBy: TOrderBy | TOrderBy[]
}

type SortMap<TOrderBy> = Record<string, SortDefinition<TOrderBy>>

/**
 * Creates a sort parser with a typed map of sort options.
 * Uses `parseAsString` to accept any string, with server-side resolution
 * through the map. Unknown keys resolve to `undefined` (use default sort).
 */
export const createSortParser = <TOrderBy>(sortMap: SortMap<TOrderBy>) => ({
  parser: parseAsString.withDefault(""),
  resolve: (key: string): TOrderBy | TOrderBy[] | undefined => sortMap[key]?.orderBy,
  options: sortMap,
})

const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
})

/**
 * Creates a parser for TanStack Table sorting state.
 * @param originalRow The original row data to validate sorting keys against.
 * @returns A parser for TanStack Table sorting state.
 */
export const getSortingStateParser = <TData>(originalRow?: Row<TData>["original"]) => {
  const validKeys = originalRow ? new Set(Object.keys(originalRow)) : null

  return createParser<ExtendedSortingState<TData>>({
    parse: value => {
      try {
        const parsed = JSON.parse(value)
        const result = z.array(sortingItemSchema).safeParse(parsed)

        if (!result.success) return null

        if (validKeys && result.data.some(item => !validKeys.has(item.id))) {
          return null
        }

        return result.data as ExtendedSortingState<TData>
      } catch {
        return null
      }
    },
    serialize: value => JSON.stringify(value),
    eq: (a, b) =>
      a.length === b.length &&
      a.every((item, index) => item.id === b[index]?.id && item.desc === b[index]?.desc),
  })
}

/**
 * Checks if the state is the default state.
 * @param parsers The parsers to check.
 * @param values The values to check.
 * @param excludeKeys Keys to exclude from the check.
 * @returns True if the state is the default state, false otherwise.
 */
export const isDefaultState = <Parsers extends ParserMap>(
  parsers: Parsers,
  values: inferParserType<Parsers>,
  excludeKeys: (keyof Parsers)[] = [],
) => {
  for (const key of Object.keys(parsers) as Array<keyof Parsers>) {
    if (excludeKeys.includes(key)) {
      continue
    }

    if (!parsers[key].eq(values[key], parsers[key].defaultValue)) {
      return false
    }
  }

  return true
}
