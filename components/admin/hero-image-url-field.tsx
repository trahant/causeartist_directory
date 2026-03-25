"use client"

import { UploadIcon } from "lucide-react"
import { useRef } from "react"
import type { ChangeEvent } from "react"
import type { Ref } from "react"
import type { ControllerFieldState } from "react-hook-form"
import { Button } from "~/components/common/button"
import { Field, FieldError, FieldLabel } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { Note } from "~/components/common/note"
import { Stack } from "~/components/common/stack"
import { useMediaUpload } from "~/hooks/use-media-upload"
import { cx } from "~/lib/utils"

const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/avif"

type HeroImageUrlFieldProps = {
  field: {
    name: string
    value: string | null | undefined
    onChange: (value: string) => void
    onBlur: () => void
    ref: Ref<HTMLInputElement>
  }
  fieldState: ControllerFieldState
  uploadKeyPrefix: string
  className?: string
}

export function HeroImageUrlField({ field, fieldState, uploadKeyPrefix, className }: HeroImageUrlFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { uploadFile, isUploading } = useMediaUpload("", { keyPrefix: uploadKeyPrefix })

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    await uploadFile(file, uploaded => field.onChange(uploaded.url))
  }

  const value = field.value ?? ""

  return (
    <Field data-invalid={fieldState.invalid} className={cx("col-span-full", className)}>
      <FieldLabel htmlFor={field.name}>Hero image</FieldLabel>
      <Stack direction="column" size="sm" className="w-full">
        <Stack direction="row" size="sm" wrap className="items-center">
          <Input
            id={field.name}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={value}
            onChange={e => field.onChange(e.target.value)}
            placeholder="https://…"
            className="min-w-0 flex-1"
          />
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={onPickFile}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isUploading}
            prefix={<UploadIcon className="size-4" />}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? "Uploading…" : "Upload"}
          </Button>
        </Stack>
        <Note className="text-muted-foreground">
          Paste a URL or upload (JPEG, PNG, WebP, AVIF). Uploads use Supabase Storage (SUPABASE_URL, service role key,
          bucket in .env.local).
        </Note>
        {value ? (
          <img
            src={value}
            alt=""
            className="max-h-28 max-w-full rounded-md border object-contain"
          />
        ) : null}
      </Stack>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )
}
