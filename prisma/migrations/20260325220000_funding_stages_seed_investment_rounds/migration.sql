-- AlterTable
ALTER TABLE "FundingStage" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 100;

-- Seed canonical investment stages from Seed through IPO (safe if slug already exists)
INSERT INTO "FundingStage" ("id", "name", "slug", "sortOrder")
SELECT 'ir2m1woyhqjmu905p646iac4', 'Seed', 'seed', 1
WHERE NOT EXISTS (SELECT 1 FROM "FundingStage" WHERE "slug" = 'seed');

INSERT INTO "FundingStage" ("id", "name", "slug", "sortOrder")
SELECT 'w2xt7lrxwm04rllr0fdgpto6', 'Series A', 'series-a', 2
WHERE NOT EXISTS (SELECT 1 FROM "FundingStage" WHERE "slug" = 'series-a');

INSERT INTO "FundingStage" ("id", "name", "slug", "sortOrder")
SELECT 'gfrfl8478lliopaexn9uzqwc', 'Series B', 'series-b', 3
WHERE NOT EXISTS (SELECT 1 FROM "FundingStage" WHERE "slug" = 'series-b');

INSERT INTO "FundingStage" ("id", "name", "slug", "sortOrder")
SELECT 'jefhiqrmwayg4rfdgb1j42xx', 'Series C', 'series-c', 4
WHERE NOT EXISTS (SELECT 1 FROM "FundingStage" WHERE "slug" = 'series-c');

INSERT INTO "FundingStage" ("id", "name", "slug", "sortOrder")
SELECT 'cz9cqha0w2gm7yds3z9mf1i0', 'Series D', 'series-d', 5
WHERE NOT EXISTS (SELECT 1 FROM "FundingStage" WHERE "slug" = 'series-d');

INSERT INTO "FundingStage" ("id", "name", "slug", "sortOrder")
SELECT 'z6aa993upm1y46oy43e9xhnd', 'Growth', 'growth', 6
WHERE NOT EXISTS (SELECT 1 FROM "FundingStage" WHERE "slug" = 'growth');

INSERT INTO "FundingStage" ("id", "name", "slug", "sortOrder")
SELECT 'brn7cnssfqa820fpxwd7watn', 'Pre-IPO', 'pre-ipo', 7
WHERE NOT EXISTS (SELECT 1 FROM "FundingStage" WHERE "slug" = 'pre-ipo');

INSERT INTO "FundingStage" ("id", "name", "slug", "sortOrder")
SELECT 'p1m9gljcpvicccb2bid40kpc', 'IPO', 'ipo', 8
WHERE NOT EXISTS (SELECT 1 FROM "FundingStage" WHERE "slug" = 'ipo');
