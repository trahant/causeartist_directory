-- AlterTable
ALTER TABLE "PodcastEpisode" ADD COLUMN "guestName" TEXT,
ADD COLUMN "guestTitle" TEXT,
ADD COLUMN "guestCompany" TEXT;

-- AlterTable
ALTER TABLE "CompanyEpisode" DROP CONSTRAINT "CompanyEpisode_episodeId_fkey";

-- AlterTable
ALTER TABLE "CompanyEpisode" ADD CONSTRAINT "CompanyEpisode_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "PodcastEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "FunderEpisode" DROP CONSTRAINT "FunderEpisode_episodeId_fkey";

-- AlterTable
ALTER TABLE "FunderEpisode" ADD CONSTRAINT "FunderEpisode_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "PodcastEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
