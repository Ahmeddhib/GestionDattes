-- 1. Add nullable typeDateId columns
ALTER TABLE "LivraisonTypeCaisse" ADD COLUMN "typeDateId" TEXT;
ALTER TABLE "Pesee" ADD COLUMN "typeDateId" TEXT;

-- 2. Backfill from the (about-to-be-dropped) Livraison.typeDateId
UPDATE "LivraisonTypeCaisse" ltc
SET "typeDateId" = l."typeDateId"
FROM "Livraison" l
WHERE l.id = ltc."livraisonId";

UPDATE "Pesee" p
SET "typeDateId" = l."typeDateId"
FROM "Livraison" l
WHERE l.id = p."livraisonId";

-- 3. Enforce NOT NULL now that every row is backfilled
ALTER TABLE "LivraisonTypeCaisse" ALTER COLUMN "typeDateId" SET NOT NULL;
ALTER TABLE "Pesee" ALTER COLUMN "typeDateId" SET NOT NULL;

-- 4. Add FKs
ALTER TABLE "LivraisonTypeCaisse" ADD CONSTRAINT "LivraisonTypeCaisse_typeDateId_fkey"
  FOREIGN KEY ("typeDateId") REFERENCES "TypeDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pesee" ADD CONSTRAINT "Pesee_typeDateId_fkey"
  FOREIGN KEY ("typeDateId") REFERENCES "TypeDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Drop old 2-key unique indexes, add new 3-key ones
DROP INDEX "LivraisonTypeCaisse_livraisonId_typeCaisseId_key";
DROP INDEX "Pesee_livraisonId_typeCaisseId_key";

CREATE UNIQUE INDEX "LivraisonTypeCaisse_livraisonId_typeCaisseId_typeDateId_key"
  ON "LivraisonTypeCaisse"("livraisonId", "typeCaisseId", "typeDateId");
CREATE UNIQUE INDEX "Pesee_livraisonId_typeCaisseId_typeDateId_key"
  ON "Pesee"("livraisonId", "typeCaisseId", "typeDateId");

-- 6. New indexes
CREATE INDEX "LivraisonTypeCaisse_typeDateId_idx" ON "LivraisonTypeCaisse"("typeDateId");
CREATE INDEX "Pesee_typeDateId_idx" ON "Pesee"("typeDateId");

-- 7. StockDate: enforce one row per (livraison, typeDate) -- already true for
--    all existing data (verified: zero livraisons currently have more than
--    one StockDate row).
CREATE UNIQUE INDEX "StockDate_livraisonId_typeDateId_key" ON "StockDate"("livraisonId", "typeDateId");

-- 8. Drop Livraison.typeDateId (column + FK + index), only after 1-7 succeeded
ALTER TABLE "Livraison" DROP CONSTRAINT IF EXISTS "Livraison_typeDateId_fkey";
DROP INDEX IF EXISTS "Livraison_typeDateId_idx";
ALTER TABLE "Livraison" DROP COLUMN "typeDateId";

-- 9. BonAchat.observations
ALTER TABLE "BonAchat" ADD COLUMN "observations" TEXT;
