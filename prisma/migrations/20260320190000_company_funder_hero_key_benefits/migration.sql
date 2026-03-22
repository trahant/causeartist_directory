-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "keyBenefits" JSONB;

-- AlterTable
ALTER TABLE "Funder" ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "keyBenefits" JSONB;
