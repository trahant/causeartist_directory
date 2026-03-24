-- Add "AI and Robotics" sector (safe if slug already exists)
INSERT INTO "Sector" ("id", "name", "slug", "heroText", "createdAt")
SELECT 'czq3stbqadsi8jsfcsd1gqiq', 'AI and Robotics', 'ai-and-robotics', NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Sector" WHERE "slug" = 'ai-and-robotics');
