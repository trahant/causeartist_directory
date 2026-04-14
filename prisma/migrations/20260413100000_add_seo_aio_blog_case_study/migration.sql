-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "ogImageUrl" TEXT,
ADD COLUMN     "ogImageAlt" TEXT,
ADD COLUMN     "metaRobots" TEXT,
ADD COLUMN     "focusKeyword" TEXT,
ADD COLUMN     "secondaryKeywords" JSONB,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "sources" JSONB,
ADD COLUMN     "faqItems" JSONB,
ADD COLUMN     "keyTakeaways" JSONB,
ADD COLUMN     "readingTimeMinutes" INTEGER,
ADD COLUMN     "contentType" TEXT;

-- AlterTable
ALTER TABLE "CaseStudy" ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "ogImageUrl" TEXT,
ADD COLUMN     "ogImageAlt" TEXT,
ADD COLUMN     "metaRobots" TEXT,
ADD COLUMN     "focusKeyword" TEXT,
ADD COLUMN     "secondaryKeywords" JSONB,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "sources" JSONB,
ADD COLUMN     "faqItems" JSONB,
ADD COLUMN     "keyTakeaways" JSONB,
ADD COLUMN     "readingTimeMinutes" INTEGER,
ADD COLUMN     "contentType" TEXT;
