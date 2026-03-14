import { S3Client } from "@aws-sdk/client-s3"
import { env } from "~/env"

const hasS3Config =
  env.S3_REGION != null &&
  env.S3_ACCESS_KEY != null &&
  env.S3_SECRET_ACCESS_KEY != null

export const s3Client: S3Client | null = hasS3Config
  ? new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION!,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY!,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      },
      maxAttempts: 5,
      retryMode: "standard",
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      forcePathStyle: true,
    })
  : null
