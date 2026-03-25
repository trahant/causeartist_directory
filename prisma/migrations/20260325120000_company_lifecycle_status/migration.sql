-- CreateEnum
CREATE TYPE "CompanyLifecycleStatus" AS ENUM ('Active', 'Acquired', 'Sunsetted');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "lifecycleStatus" "CompanyLifecycleStatus" NOT NULL DEFAULT 'Active';
