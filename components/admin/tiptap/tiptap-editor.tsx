"use client"

import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { TableKit } from "@tiptap/extension-table"
import Typography from "@tiptap/extension-typography"
import { Markdown } from "@tiptap/markdown"
import { type Editor, EditorContent, Extension, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { type ComponentProps, createContext, useEffect } from "react"
import { TiptapToolbar } from "~/components/admin/tiptap/tiptap-toolbar"
import { proseContentClasses } from "~/components/common/prose"
import { cx } from "~/lib/utils"

export const TiptapMediaContext = createContext<{ mediaPath: string }>({ mediaPath: "" })

type TiptapEditorProps = Omit<ComponentProps<"div">, "onChange"> & {
  value?: string
  onUpdate?: (editor: Editor) => void
  mediaPath?: string
}

export const TiptapEditor = ({
  className,
  value,
  onUpdate: onUpdateProp,
  mediaPath = "",
  ...props
}: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Image.configure({ inline: true }).extend({
        group: () => "inline",
        marks: "link",
        renderMarkdown: node => {
          const src = node.attrs?.src ?? ""
          const alt = node.attrs?.alt ?? ""
          const title = node.attrs?.title ?? ""
          const imgMd = title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`

          const linkMark = node.marks?.find((m: { type: string }) => m.type === "link")

          if (linkMark) {
            const href = linkMark.attrs?.href ?? ""
            const linkTitle = linkMark.attrs?.title ?? ""
            return linkTitle ? `[${imgMd}](${href} "${linkTitle}")` : `[${imgMd}](${href})`
          }

          return imgMd
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
      }).extend({
        parseMarkdown: (token, helpers) => {
          const tokens = token.tokens || []

          // When a link wraps a single image, add the link mark directly
          // to the image node (bypasses applyMarkToContent which only handles text nodes)
          if (tokens.length === 1 && tokens[0].type === "image") {
            const imgToken = tokens[0]
            const imgNode = helpers.createNode("image", {
              src: imgToken.href,
              title: imgToken.title,
              alt: imgToken.text,
            })

            return {
              ...imgNode,
              marks: [
                ...(imgNode.marks || []),
                { type: "link", attrs: { href: token.href, title: token.title || null } },
              ],
            }
          }

          // Default behavior for text links
          return helpers.applyMark("link", helpers.parseInline(tokens), {
            href: token.href,
            title: token.title || null,
          })
        },
      }),
      TableKit.configure({
        table: { resizable: false },
      }),
      Typography,
      Markdown,
      Extension.create({
        addKeyboardShortcuts: () => ({ "Mod-Enter": () => true }),
      }),
    ],
    immediatelyRender: false,
    content: value,
    contentType: "markdown",
    onUpdate: ({ editor }) => {
      onUpdateProp?.(editor)
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    const currentMarkdown = editor.getMarkdown()
    if (value !== currentMarkdown) {
      editor.commands.setContent(value ?? "", { contentType: "markdown" })
    }
  }, [editor, value])

  return (
    <TiptapMediaContext.Provider value={{ mediaPath }}>
      <div
        className={cx(
          "flex flex-col rounded-md border outline-transparent transition duration-100 ease-out",
          "focus-within:outline-2 focus-within:outline-border/50 focus-within:border-ring",
          className,
        )}
        {...props}
      >
        <TiptapToolbar editor={editor} />
        <EditorContent
          editor={editor}
          className={cx(
            "max-w-none bg-background rounded-b-md outline-none",
            "[&_.tiptap]:min-h-75 [&_.tiptap]:p-4 [&_.tiptap]:outline-none",
            "[&_.ProseMirror-selectednode]:outline [&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-primary [&_.ProseMirror-selectednode]:rounded-sm",
            ...proseContentClasses,
          )}
        />
      </div>
    </TiptapMediaContext.Provider>
  )
}
