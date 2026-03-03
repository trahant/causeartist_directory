"use client"

import { type Editor, useEditorState } from "@tiptap/react"
import {
  BoldIcon,
  CodeIcon,
  CodeSquareIcon,
  Columns2Icon,
  GlobeIcon,
  Grid3x3Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  Redo2Icon,
  Rows2Icon,
  StrikethroughIcon,
  TableIcon,
  Trash2Icon,
  Undo2Icon,
  UnlinkIcon,
  UploadIcon,
} from "lucide-react"
import { useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { TiptapMediaContext } from "~/components/admin/tiptap/tiptap-editor"
import { Button } from "~/components/common/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/common/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { useMediaUpload } from "~/hooks/use-media-upload"
import { cx } from "~/lib/utils"
import { ALLOWED_MIMETYPES } from "~/server/web/shared/schema"

type ToolbarUrlDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onConfirm: (url: string) => void
}

const ToolbarUrlDialog = ({ open, onOpenChange, title, onConfirm }: ToolbarUrlDialogProps) => {
  const [url, setUrl] = useState("")

  const handleConfirm = () => {
    if (url.trim()) {
      onConfirm(url.trim())
      setUrl("")
      onOpenChange(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setUrl("")
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://"
          autoFocus
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleConfirm()
            }
          }}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button size="md" variant="secondary" suffix={<Kbd keys={["esc"]} />}>
              Cancel
            </Button>
          </DialogClose>

          <Button
            size="md"
            onClick={handleConfirm}
            disabled={!url.trim()}
            suffix={<Kbd variant="outline" keys={["enter"]} />}
          >
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ToolbarButtonProps = {
  icon: ReactNode
  title: string
  isActive?: boolean
  disabled?: boolean
  onClick: () => void
}

const ToolbarButton = ({ icon, title, isActive, disabled, onClick }: ToolbarButtonProps) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={isActive !== undefined ? isActive : undefined}
    disabled={disabled}
    onMouseDown={e => {
      e.preventDefault()
      onClick()
    }}
    className={cx(
      "inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none",
      isActive && "bg-muted text-foreground",
    )}
  >
    <span className="size-4 [&>svg]:size-4">{icon}</span>
  </button>
)

const ToolbarSeparator = () => <div className="mx-1 h-6 w-px bg-border" />

type TiptapToolbarProps = {
  editor: Editor | null
}

export const TiptapToolbar = ({ editor }: TiptapToolbarProps) => {
  const { mediaPath } = useContext(TiptapMediaContext)
  const { uploadFile } = useMediaUpload(mediaPath)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlDialogMode, setUrlDialogMode] = useState<"link" | "image" | null>(null)
  const [urlDialogOpen, setUrlDialogOpen] = useState(false)

  const activeState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null

      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        strike: e.isActive("strike"),
        code: e.isActive("code"),
        heading1: e.isActive("heading", { level: 1 }),
        heading2: e.isActive("heading", { level: 2 }),
        heading3: e.isActive("heading", { level: 3 }),
        heading4: e.isActive("heading", { level: 4 }),
        heading5: e.isActive("heading", { level: 5 }),
        heading6: e.isActive("heading", { level: 6 }),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        blockquote: e.isActive("blockquote"),
        codeBlock: e.isActive("codeBlock"),
        link: e.isActive("link"),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      }
    },
  })

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files?.length || !editor) return

      for (const file of Array.from(files)) {
        uploadFile(file, uploaded => {
          editor.chain().focus().setImage({ src: uploaded.url }).run()
        })
      }

      // Reset input so the same file can be re-selected
      e.target.value = ""
    },
    [editor, uploadFile],
  )

  const insertLink = useCallback(() => {
    setUrlDialogMode("link")
    setUrlDialogOpen(true)
  }, [])

  const insertImageFromUrl = useCallback(() => {
    setUrlDialogMode("image")
    setUrlDialogOpen(true)
  }, [])

  const handleUrlDialogConfirm = useCallback(
    (url: string) => {
      if (!editor) return

      if (urlDialogMode === "image") {
        editor.chain().focus().setImage({ src: url }).run()
      } else if (urlDialogMode === "link") {
        editor.chain().focus().setLink({ href: url }).run()
      }

      setUrlDialogMode(null)
    },
    [editor, urlDialogMode],
  )

  if (!editor) return null

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 bg-background border-b rounded-t-md p-1.5"
    >
      <ToolbarButton
        icon={<BoldIcon />}
        title="Bold (Ctrl+B)"
        isActive={activeState?.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={<ItalicIcon />}
        title="Italic (Ctrl+I)"
        isActive={activeState?.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={<StrikethroughIcon />}
        title="Strikethrough"
        isActive={activeState?.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />

      <ToolbarSeparator />

      <ToolbarButton
        icon={<CodeIcon />}
        title="Inline Code"
        isActive={activeState?.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />

      <ToolbarSeparator />

      <ToolbarButton
        icon={<Heading1Icon />}
        title="Heading 1"
        isActive={activeState?.heading1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={<Heading2Icon />}
        title="Heading 2"
        isActive={activeState?.heading2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={<Heading3Icon />}
        title="Heading 3"
        isActive={activeState?.heading3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        icon={<Heading4Icon />}
        title="Heading 4"
        isActive={activeState?.heading4}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      />
      <ToolbarButton
        icon={<Heading5Icon />}
        title="Heading 5"
        isActive={activeState?.heading5}
        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
      />
      <ToolbarButton
        icon={<Heading6Icon />}
        title="Heading 6"
        isActive={activeState?.heading6}
        onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
      />

      <ToolbarSeparator />

      <ToolbarButton
        icon={<ListIcon />}
        title="Bullet List"
        isActive={activeState?.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={<ListOrderedIcon />}
        title="Ordered List"
        isActive={activeState?.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />

      <ToolbarSeparator />

      <ToolbarButton
        icon={<QuoteIcon />}
        title="Blockquote"
        isActive={activeState?.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        icon={<CodeSquareIcon />}
        title="Code Block"
        isActive={activeState?.codeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />

      <ToolbarSeparator />

      <ToolbarButton
        icon={<LinkIcon />}
        title="Insert Link"
        isActive={activeState?.link}
        onClick={insertLink}
      />

      {activeState?.link && (
        <ToolbarButton
          icon={<UnlinkIcon />}
          title="Remove Link"
          onClick={() => editor.chain().focus().unsetLink().run()}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Insert Image"
            aria-label="Insert Image"
            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="size-4 [&>svg]:size-4">
              <ImageIcon />
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
            <UploadIcon />
            Upload from computer
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={insertImageFromUrl}>
            <GlobeIcon />
            Insert from URL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIMETYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Table"
            aria-label="Table"
            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="size-4 [&>svg]:size-4">
              <TableIcon />
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onSelect={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <Grid3x3Icon />
            Insert Table
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => editor.chain().focus().addRowBefore().run()}>
            <Rows2Icon />
            Add Row Before
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => editor.chain().focus().addRowAfter().run()}>
            <Rows2Icon />
            Add Row After
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => editor.chain().focus().addColumnBefore().run()}>
            <Columns2Icon />
            Add Column Before
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => editor.chain().focus().addColumnAfter().run()}>
            <Columns2Icon />
            Add Column After
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => editor.chain().focus().deleteRow().run()}>
            <Trash2Icon />
            Delete Row
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => editor.chain().focus().deleteColumn().run()}>
            <Trash2Icon />
            Delete Column
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => editor.chain().focus().deleteTable().run()}>
            <Trash2Icon />
            Delete Table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarSeparator />

      <ToolbarButton
        icon={<MinusIcon />}
        title="Horizontal Rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />

      <ToolbarSeparator />

      <ToolbarButton
        icon={<Undo2Icon />}
        title="Undo"
        disabled={!activeState?.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={<Redo2Icon />}
        title="Redo"
        disabled={!activeState?.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      />

      <ToolbarUrlDialog
        open={urlDialogOpen}
        onOpenChange={setUrlDialogOpen}
        title={urlDialogMode === "image" ? "Insert Image URL" : "Insert Link URL"}
        onConfirm={handleUrlDialogConfirm}
      />
    </div>
  )
}
