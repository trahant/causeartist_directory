import { isMimeTypeMatch } from "@primoui/utils"
import type { useTranslations } from "next-intl"
import { z } from "zod"
import { ReportType } from "~/.generated/prisma/browser"

type TFunction = ReturnType<typeof useTranslations>

export const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]

const createPathSchema = (t: TFunction) => {
  return z.object({
    path: z.string().regex(/^[a-z0-9/_-]+$/i, { error: t("invalidPath") }),
  })
}

export const createFileSchema = (t: TFunction, options?: { maxSize?: number }) => {
  const maxSize = options?.maxSize ?? 1024 * 1024

  return z
    .instanceof(File)
    .refine(({ size }) => size > 0, { error: t("fileCannotBeEmpty") })
    .refine(({ size }) => size < maxSize, { error: t("fileSizeTooLarge") })
    .refine(({ type }) => isMimeTypeMatch(type, ALLOWED_MIMETYPES), { error: t("fileTypeInvalid") })
}

export const createSubmitToolSchema = (t: TFunction) => {
  return z.object({
    name: z.string().min(1, { error: t("required") }),
    websiteUrl: z
      .url({ protocol: /^https?$/, normalize: true, error: t("invalidUrl") })
      .min(1, { error: t("required") }),
    submitterNote: z
      .string()
      .max(256, { error: issue => t("maxLength", { length: Number(issue.maximum) }) }),
    newsletterOptIn: z.boolean().optional().default(true),
  })
}

export const createNewsletterSchema = (t: TFunction) => {
  return z.object({
    captcha: z.literal("").optional(),
    email: z.email({ error: t("invalidEmail") }),
  })
}

export const createContactFormSchema = (t: TFunction) => {
  return z.object({
    captcha: z.literal("").optional(),
    name: z
      .string()
      .trim()
      .min(1, { error: t("required") })
      .max(120, { error: issue => t("maxLength", { length: Number(issue.maximum) }) }),
    email: z.email({ error: t("invalidEmail") }),
    message: z
      .string()
      .trim()
      .min(10, { error: issue => t("minLength", { length: Number(issue.minimum) }) })
      .max(8000, { error: issue => t("maxLength", { length: Number(issue.maximum) }) }),
    newsletterOptIn: z.boolean().optional().default(false),
  })
}

export const createReportToolSchema = (t: TFunction) => {
  return z
    .object({
      type: z.enum(ReportType, { error: t("required") }),
      email: z.email({ error: t("invalidEmail") }),
      message: z
        .string()
        .max(256, { error: issue => t("maxLength", { length: Number(issue.maximum) }) }),
      toolId: z.string(),
    })
    .refine(data => data.type !== ReportType.Other || data.message.length > 0, {
      error: t("required"),
      path: ["message"],
    })
}

export const createClaimToolEmailSchema = (t: TFunction) => {
  return z.object({
    toolId: z.string(),
    email: z.email({ error: t("invalidEmail") }),
  })
}

export const createClaimToolOtpSchema = (t: TFunction) => {
  return z.object({
    toolId: z.string(),
    otp: z.string().length(6, {
      error: issue => t("invalidLength", { length: Number(issue.minimum || issue.maximum) }),
    }),
  })
}

export const createAdDetailsSchema = (t: TFunction) => {
  return z.object({
    sessionId: z.string(),
    name: z.string().min(1, { error: t("required") }),
    description: z
      .string()
      .min(1, { error: t("required") })
      .max(160, { error: issue => t("maxLength", { length: Number(issue.maximum) }) }),
    websiteUrl: z
      .url({ protocol: /^https?$/, normalize: true, error: t("invalidUrl") })
      .min(1, { error: t("required") }),
    buttonLabel: z.string().optional(),
  })
}

export const createFetchMediaSchema = (t: TFunction) => {
  return createPathSchema(t).extend({
    url: z
      .url({ protocol: /^https?$/, normalize: true, error: t("invalidUrl") })
      .min(1, { error: t("required") }),
    type: z.enum(["favicon", "screenshot"]).default("favicon"),
  })
}

export const createUploadMediaSchema = (t: TFunction) => {
  return createPathSchema(t).extend({
    file: createFileSchema(t),
  })
}
