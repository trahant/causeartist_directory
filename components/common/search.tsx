"use client"

import { type HotkeyItem, useDebouncedState, useHotkeys } from "@mantine/hooks"
import { getDomain } from "@primoui/utils"
import { LoaderIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { InferSafeActionFnResult } from "next-safe-action"
import { useAction } from "next-safe-action/hooks"
import { useTheme } from "next-themes"
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
import { Kbd } from "~/components/common/kbd"
import { useSearch } from "~/contexts/search-context"
import { useSession } from "~/lib/auth-client"
import { searchItems } from "~/server/web/actions/search"

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
  const [results, setResults] = useState<InferSafeActionFnResult<typeof searchItems>["data"]>()
  const { resolvedTheme, setTheme, forcedTheme } = useTheme()
  const [q, setQuery] = useDebouncedState("", 250)
  const listRef = useRef<HTMLDivElement>(null)

  const isAdmin = session?.user.role === "admin"
  const isAdminPath = pathname.startsWith("/admin")
  const hasQuery = !!q.length

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
          shortcut: { meta: true, children: "1" },
          onSelect: () => navigateTo("/admin/tools/new"),
        },
        {
          label: t("navigation.new_category"),
          shortcut: { meta: true, children: "2" },
          onSelect: () => navigateTo("/admin/categories/new"),
        },
        {
          label: t("navigation.new_tag"),
          shortcut: { meta: true, children: "3" },
          onSelect: () => navigateTo("/admin/tags/new"),
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
          shortcut: { meta: true, shift: true, children: "L" },
          onSelect: () => setTheme(nextTheme),
        },
      ],
    })
  }

  for (const [_, { shortcut, onSelect }] of commandSections
    .flatMap(({ items }) => items)
    .entries()) {
    if (!shortcut) continue

    const mods = []
    if (shortcut.shift) mods.push("shift")
    if (shortcut.meta) mods.push("mod")
    if (shortcut.alt) mods.push("alt")
    if (shortcut.ctrl) mods.push("ctrl")

    hotkeys.push([[...mods, shortcut.children].join("+"), onSelect])
  }

  useHotkeys(hotkeys, [], true)

  const { execute, isPending } = useAction(searchItems, {
    onSuccess: ({ data }) => {
      setResults(data)
    },

    onError: ({ error }) => {
      console.error(error)
      setResults(undefined)
    },
  })

  useEffect(() => {
    const performSearch = async () => {
      if (hasQuery) {
        const query = q.toLowerCase().trim()

        execute({ query })
        listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        setResults(undefined)
      }
    }

    performSearch()
  }, [q, execute, hasQuery])

  return (
    <CommandDialog open={search.isOpen} onOpenChange={handleOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder={t("components.search.placeholder")}
        onValueChange={setQuery}
        className="pr-10"
        prefix={isPending && <LoaderIcon className="animate-spin" />}
        suffix={<Kbd meta>K</Kbd>}
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
          name={t("navigation.tools")}
          items={results?.tools}
          onItemSelect={navigateTo}
          getHref={({ id, slug }) => (isAdminPath ? `/admin/tools/${id}` : `/${slug}`)}
          renderItemDisplay={({ name, faviconUrl, websiteUrl }) => (
            <>
              {faviconUrl && <img src={faviconUrl} alt="" width={16} height={16} />}
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
