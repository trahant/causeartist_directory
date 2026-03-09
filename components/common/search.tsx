"use client"

import { type HotkeyItem, useDebouncedState, useHotkeys } from "@mantine/hooks"
import { getDomain } from "@primoui/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import { LoaderIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "~/components/common/command"
import { useSearch } from "~/contexts/search-context"
import { useSession } from "~/lib/auth-client"
import { webOrpc } from "~/lib/web-orpc-query"

type SearchResults = {
  tools: { id: string; slug: string; name: string; faviconUrl: string | null; websiteUrl: string }[]
  categories: { id: string; slug: string; name: string }[]
  tags: { id: string; slug: string; name: string }[]
}

type SearchResultsProps<T> = {
  name: string
  items: T[] | undefined
  onItemSelect: (url: string) => void
  getHref: (item: T) => string
  renderItemDisplay: (item: T) => ReactNode
}

const SearchResults = <T extends { id: string; slug: string; name: string }>({
  name,
  items,
  onItemSelect,
  getHref,
  renderItemDisplay,
}: SearchResultsProps<T>) => {
  if (!items?.length) return null

  return (
    <CommandGroup heading={name}>
      {items.map(item => (
        <CommandItem
          key={item.slug}
          value={`${name.toLowerCase()}:${item.slug}`}
          onSelect={() => onItemSelect(getHref(item))}
        >
          {renderItemDisplay(item)}
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

type CommandSection = {
  name: string
  items: {
    value?: string
    label: string
    shortcut?: ComponentProps<typeof CommandShortcut>
    icon?: ReactNode
    isPending?: boolean
    onSelect: () => void
  }[]
}

export const Search = () => {
  const t = useTranslations()
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearch()
  const [results, setResults] = useState<SearchResults>()
  const { resolvedTheme, setTheme, forcedTheme } = useTheme()
  const [q, setQuery] = useDebouncedState("", 250)
  const listRef = useRef<HTMLDivElement>(null)

  const isAdmin = session?.user.role === "admin"
  const isAdminPath = pathname.startsWith("/admin")
  const hasQuery = !!q.length

  const { data: featuredTools } = useQuery({
    ...webOrpc.search.findFeaturedTools.queryOptions(),
    enabled: search.isOpen && !hasQuery,
  })

  // Set featured tools as results when available and no query
  useEffect(() => {
    if (search.isOpen && !hasQuery && featuredTools) {
      setResults({ tools: featuredTools, categories: [], tags: [] })
    }
  }, [search.isOpen, hasQuery, featuredTools])

  const handleOpenChange = (open: boolean) => {
    if (open) {
      search.open()
    } else {
      search.close()
    }

    if (!open) {
      setResults(undefined)
      setQuery("")
    }
  }

  const navigateTo = (path: string) => {
    router.push(path)
    handleOpenChange(false)
  }

  const commandSections: CommandSection[] = []
  const hotkeys: HotkeyItem[] = [["mod+K", () => search.open()]]

  // Admin command sections & hotkeys
  if (isAdmin) {
    commandSections.push({
      name: t("navigation.create"),
      items: [
        {
          label: t("navigation.new_tool"),
          shortcut: { keys: ["meta", "1"] },
          onSelect: () => navigateTo("/admin/tools/new"),
        },
        {
          label: t("navigation.new_category"),
          shortcut: { keys: ["meta", "2"] },
          onSelect: () => navigateTo("/admin/categories/new"),
        },
        {
          label: t("navigation.new_tag"),
          shortcut: { keys: ["meta", "3"] },
          onSelect: () => navigateTo("/admin/tags/new"),
        },
        {
          label: t("navigation.new_post"),
          shortcut: { keys: ["meta", "4"] },
          onSelect: () => navigateTo("/admin/posts/new"),
        },
      ],
    })

    // User command sections & hotkeys
  } else {
    commandSections.push({
      name: t("navigation.quick_links"),
      items: [
        { label: t("navigation.tools"), onSelect: () => navigateTo("/") },
        { label: t("navigation.categories"), onSelect: () => navigateTo("/categories") },
        { label: t("navigation.tags"), onSelect: () => navigateTo("/tags") },
      ],
    })
  }

  if (!forcedTheme) {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark"

    commandSections.push({
      name: t("navigation.appearance"),
      items: [
        {
          value: "theme",
          label: t("navigation.switch_theme", { theme: t(`common.themes.${nextTheme}`) }),
          icon: nextTheme === "dark" ? <MoonIcon /> : <SunIcon />,
          shortcut: { keys: ["meta", "shift", "L"] },
          onSelect: () => setTheme(nextTheme),
        },
      ],
    })
  }

  for (const [_, { shortcut, onSelect }] of commandSections
    .flatMap(({ items }) => items)
    .entries()) {
    if (!shortcut) continue

    const hotkeyParts = shortcut.keys.map(key => {
      const lowerKey = key.toLowerCase()
      if (lowerKey === "meta") return "mod"
      if (["shift", "alt", "ctrl"].includes(lowerKey)) return lowerKey
      return key
    })

    hotkeys.push([hotkeyParts.join("+"), onSelect])
  }

  useHotkeys(hotkeys, [], true)

  const { mutate: executeSearch, isPending } = useMutation(
    webOrpc.search.searchItems.mutationOptions({
      onSuccess: data => {
        setResults(data)
      },
      onError: error => {
        console.error(error)
        setResults(undefined)
      },
    }),
  )

  useEffect(() => {
    if (hasQuery) {
      const query = q.toLowerCase().trim()

      executeSearch({ query })
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      if (!search.isOpen) {
        setResults(undefined)
      }
    }
  }, [q, search.isOpen, executeSearch, hasQuery])

  return (
    <CommandDialog open={search.isOpen} onOpenChange={handleOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder={t("components.search.placeholder")}
        onValueChange={setQuery}
        className="pr-10"
        prefix={isPending && <LoaderIcon className="animate-spin" />}
      />

      {hasQuery && !isPending && <CommandEmpty>{t("components.search.no_results")}</CommandEmpty>}

      <CommandList ref={listRef}>
        {!hasQuery &&
          commandSections.map(({ name, items }) => (
            <CommandGroup key={name} heading={name}>
              {items.map(({ value, label, shortcut, icon, isPending, onSelect }) => (
                <CommandItem
                  key={value || label}
                  onSelect={onSelect}
                  value={value || label}
                  disabled={isPending}
                >
                  {icon}
                  <span className="flex-1 truncate">{label}</span>
                  {isPending && <LoaderIcon className="animate-spin" />}
                  {shortcut && <CommandShortcut {...shortcut} />}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

        <SearchResults
          name={hasQuery ? t("navigation.tools") : t("navigation.featured_tools")}
          items={results?.tools}
          onItemSelect={navigateTo}
          getHref={({ id, slug }) => (isAdminPath ? `/admin/tools/${id}` : `/${slug}`)}
          renderItemDisplay={({ name, faviconUrl, websiteUrl }) => (
            <>
              {faviconUrl && <Image src={faviconUrl} alt="" width={16} height={16} />}
              <span className="flex-1 truncate">{name}</span>
              <span className="opacity-50">{getDomain(websiteUrl)}</span>
            </>
          )}
        />

        <SearchResults
          name={t("navigation.categories")}
          items={results?.categories}
          onItemSelect={navigateTo}
          getHref={({ id, slug }) =>
            isAdminPath ? `/admin/categories/${id}` : `/categories/${slug}`
          }
          renderItemDisplay={({ name }) => name}
        />

        <SearchResults
          name={t("navigation.tags")}
          items={results?.tags}
          onItemSelect={navigateTo}
          getHref={({ id, slug }) => (isAdminPath ? `/admin/tags/${id}` : `/tags/${slug}`)}
          renderItemDisplay={({ name }) => name}
        />
      </CommandList>
    </CommandDialog>
  )
}
