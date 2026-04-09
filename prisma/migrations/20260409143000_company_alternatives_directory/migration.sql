-- CreateEnum
CREATE TYPE "CompanyAlternativeRole" AS ENUM ('Target', 'Alternative', 'Both', 'Hidden');

-- AlterTable
ALTER TABLE "Company"
ADD COLUMN "alternativeRole" "CompanyAlternativeRole" NOT NULL DEFAULT 'Hidden',
ADD COLUMN "alternativesSummary" TEXT;

-- CreateTable
CREATE TABLE "CompanyAlternative" (
    "companyId" TEXT NOT NULL,
    "alternativeCompanyId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CompanyAlternative_pkey" PRIMARY KEY ("companyId","alternativeCompanyId")
);

-- CreateIndex
CREATE INDEX "CompanyAlternative_companyId_sortOrder_idx" ON "CompanyAlternative"("companyId", "sortOrder");

-- CreateIndex
CREATE INDEX "CompanyAlternative_alternativeCompanyId_idx" ON "CompanyAlternative"("alternativeCompanyId");

-- AddForeignKey
ALTER TABLE "CompanyAlternative" ADD CONSTRAINT "CompanyAlternative_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAlternative" ADD CONSTRAINT "CompanyAlternative_alternativeCompanyId_fkey" FOREIGN KEY ("alternativeCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
