"use client"

import { type HotkeyItem, useDebouncedState, useHotkeys } from "@mantine/hooks"
import { getDomain } from "@primoui/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import { LoaderIcon } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { Kbd } from "~/components/common/kbd"
import { useSearch } from "~/contexts/search-context"
import { useSession } from "~/lib/auth-client"
import { orpc } from "~/lib/orpc-query"
import type {
  SearchCategoryRow,
  SearchDirectoryCompany,
  SearchDirectoryFunder,
  SearchItemsOutput,
  SearchTagRow,
  SearchToolRow,
} from "~/server/web/search/types"

type SearchResultsProps<T> = {
  name: string
  items: T[] | undefined
  onItemSelect: (url: string) => void
  getHref: (item: T) => string
  renderItemDisplay: (item: T) => ReactNode
  itemKey?: (item: T) => string
}

const SearchResults = <T extends { id: string; slug: string; name: string }>({
  name,
  items,
  onItemSelect,
  getHref,
  renderItemDisplay,
  itemKey = item => item.slug,
}: SearchResultsProps<T>) => {
  if (!items?.length) return null

  return (
    <CommandGroup heading={name}>
      {items.map(item => (
        <CommandItem
          key={itemKey(item)}
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
  const [results, setResults] = useState<SearchItemsOutput>()
  const [q, setQuery] = useDebouncedState("", 250)
  const listRef = useRef<HTMLDivElement>(null)

  const isAdmin = session?.user.role === "admin"
  const isAdminPath = pathname.startsWith("/admin")
  const hasQuery = !!q.length
  const hasFeaturedDirectory = !isAdmin && !hasQuery && !results

  const { data: featuredDirectory } = useQuery(
    orpc.web.search.findFeaturedDirectory.queryOptions({
      enabled: search.isOpen && !hasQuery && !isAdmin,
    }),
  )

  const handleOpenChange = (open: boolean) => {
    if (open) {
      search.open()
    } else {
      search.close()
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

  if (isAdmin) {
    commandSections.push({
      name: t("navigation.create"),
      items: [
        {
          label: t("navigation.new_company"),
          shortcut: { keys: ["meta", "1"] },
          onSelect: () => navigateTo("/admin/companies"),
        },
        {
          label: t("navigation.new_funder"),
          shortcut: { keys: ["meta", "2"] },
          onSelect: () => navigateTo("/admin/funders"),
        },
        {
          label: t("navigation.new_post"),
          shortcut: { keys: ["meta", "3"] },
          onSelect: () => navigateTo("/admin/blog-posts/new"),
        },
      ],
    })
  } else {
    commandSections.push({
      name: t("navigation.quick_links"),
      items: [
        { label: t("navigation.directory"), onSelect: () => navigateTo("/#directory") },
        { label: t("navigation.companies"), onSelect: () => navigateTo("/companies") },
        { label: t("navigation.funders"), onSelect: () => navigateTo("/funders") },
        { label: t("navigation.certifications"), onSelect: () => navigateTo("/certifications") },
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

  const { mutate, isPending } = useMutation(
    orpc.web.search.searchItems.mutationOptions({
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

      mutate({ query })
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      setResults(undefined)
    }
  }, [q, search.isOpen, mutate, hasQuery])

  const hasAnyResults =
    !!results &&
    (isAdminPath
      ? results.companies.length > 0 || results.funders.length > 0
      : results.tools.length > 0 ||
        results.companies.length > 0 ||
        results.funders.length > 0 ||
        results.categories.length > 0 ||
        results.tags.length > 0)

  return (
    <CommandDialog open={search.isOpen} onOpenChange={handleOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder={t("components.search.placeholder")}
        onValueChange={setQuery}
        className="pr-10"
        prefix={isPending && <LoaderIcon className="animate-spin" />}
        suffix={<Kbd keys={["meta", "K"]} />}
      />

      {hasQuery && !isPending && !hasAnyResults && (
        <CommandEmpty>{t("components.search.no_results")}</CommandEmpty>
      )}

      <CommandList ref={listRef}>
        {!hasQuery &&
          commandSections.map(({ name, items }) => (
            <CommandGroup key={name} heading={name}>
              {items.map(({ value, label, shortcut, icon, isPending: itemPending, onSelect }) => (
                <CommandItem
                  key={value || label}
                  onSelect={onSelect}
                  value={value || label}
                  disabled={itemPending}
                >
                  {icon}
                  <span className="flex-1 truncate">{label}</span>
                  {itemPending && <LoaderIcon className="animate-spin" />}
                  {shortcut && <CommandShortcut {...shortcut} />}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

        {!isAdminPath && (
          <SearchResults<SearchToolRow>
            name={t("navigation.tools")}
            items={results?.tools}
            onItemSelect={navigateTo}
            getHref={({ slug }) => `/${slug}`}
            itemKey={item => `tool-${item.id}`}
            renderItemDisplay={({ name, faviconUrl, websiteUrl }) => (
              <>
                {faviconUrl && <Image src={faviconUrl} alt="" width={16} height={16} />}
                <span className="flex-1 truncate">{name}</span>
                <span className="opacity-50">{getDomain(websiteUrl)}</span>
              </>
            )}
          />
        )}

        <SearchResults<SearchDirectoryCompany>
          name={t("navigation.companies")}
          items={
            hasFeaturedDirectory ? featuredDirectory?.companies : results?.companies
          }
          onItemSelect={navigateTo}
          getHref={({ slug }) => `/companies/${slug}`}
          itemKey={item => `company-${item.id}`}
          renderItemDisplay={({ name, logoUrl }) => (
            <>
              {logoUrl && (
                <Image src={logoUrl} alt="" width={16} height={16} className="rounded-sm" />
              )}
              <span className="flex-1 truncate">{name}</span>
            </>
          )}
        />

        <SearchResults<SearchDirectoryFunder>
          name={t("navigation.funders")}
          items={hasFeaturedDirectory ? featuredDirectory?.funders : results?.funders}
          onItemSelect={navigateTo}
          getHref={({ slug }) => `/funders/${slug}`}
          itemKey={item => `funder-${item.id}`}
          renderItemDisplay={({ name, logoUrl, website }) => (
            <>
              {logoUrl && (
                <Image src={logoUrl} alt="" width={16} height={16} className="rounded-sm" />
              )}
              <span className="flex-1 truncate">{name}</span>
              {website ? (
                <span className="opacity-50">{getDomain(website)}</span>
              ) : null}
            </>
          )}
        />

        {!isAdminPath && (
          <SearchResults<SearchCategoryRow>
            name={t("navigation.categories")}
            items={results?.categories}
            onItemSelect={navigateTo}
            getHref={({ id, slug }) =>
              isAdminPath ? `/admin/categories/${id}` : `/categories/${slug}`
            }
            itemKey={item => `cat-${item.id}`}
            renderItemDisplay={({ name }) => name}
          />
        )}

        {!isAdminPath && (
          <SearchResults<SearchTagRow>
            name={t("navigation.tags")}
            items={results?.tags}
            onItemSelect={navigateTo}
            getHref={({ id, slug }) => (isAdminPath ? `/admin/tags/${id}` : `/tags/${slug}`)}
            itemKey={item => `tag-${item.id}`}
            renderItemDisplay={({ name }) => name}
          />
        )}
      </CommandList>
    </CommandDialog>
  )
}
