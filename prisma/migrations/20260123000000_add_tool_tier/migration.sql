-- CreateEnum
CREATE TYPE "ToolTier" AS ENUM ('Free', 'Standard', 'Premium');

-- AlterTable: Add tier column with default value
ALTER TABLE "Tool" ADD COLUMN "tier" "ToolTier" NOT NULL DEFAULT 'Free';

-- Migrate existing data: isFeatured=true becomes Premium
UPDATE "Tool" SET "tier" = 'Premium' WHERE "isFeatured" = true;

-- Drop the old isFeatured column
ALTER TABLE "Tool" DROP COLUMN "isFeatured";
