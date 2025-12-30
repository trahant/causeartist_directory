import { isValidUrl } from "@primoui/utils"
import { capitalCase } from "change-case"
import { DownloadCloudIcon, UploadIcon } from "lucide-react"
import { type ComponentProps, useRef } from "react"
import type { ControllerRenderProps, FieldPath, FieldValues, UseFormReturn } from "react-hook-form"
import { Button } from "~/components/common/button"
import { FormControl, FormItem, FormLabel, FormMessage } from "~/components/common/form"
import { Input } from "~/components/common/input"
import { Stack } from "~/components/common/stack"
import { useMediaAction } from "~/hooks/use-media-action"
import { cx } from "~/lib/utils"
import { ALLOWED_MIMETYPES } from "~/server/web/shared/schema"

type FormMediaProps<T extends FieldValues> = ComponentProps<typeof FormItem> & {
  form: UseFormReturn<T>
  field: ControllerRenderProps<T, FieldPath<T>>
  path: string
  fetchType?: "favicon" | "screenshot"
  websiteUrl?: string
}

export const FormMedia = <T extends FieldValues>({
  children,
  className,
  form,
  field,
  path,
  fetchType,
  websiteUrl,
  ...props
}: FormMediaProps<T>) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const action = useMediaAction({ form, path, fieldName: field.name, fetchType })

  return (
    <FormItem className={cx("items-stretch", className)} {...props}>
      <Stack className="justify-between">
        <FormLabel className="flex-1">{capitalCase(field.name)}</FormLabel>

        <Stack size="xs" className="-my-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            prefix={<UploadIcon />}
            isPending={action.isUploading}
            disabled={action.isUploading || action.isFetching}
            onClick={() => inputRef.current?.click()}
          >
            Upload
          </Button>

          {websiteUrl !== undefined && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              prefix={<DownloadCloudIcon />}
              isPending={action.isFetching}
              disabled={!isValidUrl(websiteUrl) || action.isUploading || action.isFetching}
              onClick={() => action.handleFetch(websiteUrl)}
            >
              Fetch
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack size="sm">
        {children}

        <FormControl>
          <Input type="url" className="flex-1" {...field} />
        </FormControl>
      </Stack>

      <FormMessage />

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIMETYPES.join(",")}
        onChange={action.handleUpload}
        className="hidden"
      />
    </FormItem>
  )
}
