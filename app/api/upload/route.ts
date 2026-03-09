import { NextResponse } from "next/server"
import { uploadToS3Storage } from "~/lib/media"
import { createUploadMediaSchema } from "~/server/web/shared/schema"

export async function POST(request: Request) {
  const { getTranslations } = await import("next-intl/server")
  const t = await getTranslations("schema")
  const schema = createUploadMediaSchema(t)

  const formData = await request.formData()

  const { data, error } = schema.safeParse({
    path: formData.get("path"),
    file: formData.get("file"),
  })

  if (error) {
    return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 })
  }

  const buffer = Buffer.from(await data.file.arrayBuffer())
  const url = await uploadToS3Storage(buffer, data.path)

  return NextResponse.json({ data: url })
}
