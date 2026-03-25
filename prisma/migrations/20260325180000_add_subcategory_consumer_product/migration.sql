-- Add "Consumer Product" focus-area subcategory (safe if slug already exists)
INSERT INTO "Subcategory" ("id", "name", "slug", "createdAt")
SELECT 'wikunbffgni7nnfjfflwze0k', 'Consumer Product', 'consumer-product', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Subcategory" WHERE "slug" = 'consumer-product');
