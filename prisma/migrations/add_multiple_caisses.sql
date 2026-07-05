-- Migration: Add support for multiple TypeCaisses per Livraison
-- Date: 2026-07-04

-- Step 1: Create the new LivraisonTypeCaisse table
CREATE TABLE "LivraisonTypeCaisse" (
    "id" TEXT NOT NULL,
    "livraisonId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LivraisonTypeCaisse_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create indexes
CREATE UNIQUE INDEX "LivraisonTypeCaisse_livraisonId_typeCaisseId_key" ON "LivraisonTypeCaisse"("livraisonId", "typeCaisseId");
CREATE INDEX "LivraisonTypeCaisse_livraisonId_idx" ON "LivraisonTypeCaisse"("livraisonId");
CREATE INDEX "LivraisonTypeCaisse_typeCaisseId_idx" ON "LivraisonTypeCaisse"("typeCaisseId");

-- Step 3: Add foreign keys
ALTER TABLE "LivraisonTypeCaisse" ADD CONSTRAINT "LivraisonTypeCaisse_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "Livraison"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LivraisonTypeCaisse" ADD CONSTRAINT "LivraisonTypeCaisse_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON UPDATE CASCADE;

-- Step 4: Migrate existing data from Livraison to LivraisonTypeCaisse
-- For each existing Livraison, create one LivraisonTypeCaisse entry
INSERT INTO "LivraisonTypeCaisse" ("id", "livraisonId", "typeCaisseId", "quantite", "createdAt")
SELECT 
    gen_random_uuid()::text as id,
    l."id" as "livraisonId",
    l."typeCaisseId",
    -- Calculate quantite as quantiteKg / poidsKg, rounded up
    CEIL(l."quantiteKg" / tc."poidsKg")::INTEGER as quantite,
    l."createdAt"
FROM "Livraison" l
INNER JOIN "TypeCaisse" tc ON l."typeCaisseId" = tc."id"
WHERE l."typeCaisseId" IS NOT NULL AND l."quantiteKg" IS NOT NULL;

-- Step 5: Drop the old columns from Livraison
ALTER TABLE "Livraison" DROP CONSTRAINT IF EXISTS "Livraison_typeCaisseId_fkey";
ALTER TABLE "Livraison" DROP COLUMN IF EXISTS "typeCaisseId";
ALTER TABLE "Livraison" DROP COLUMN IF EXISTS "quantiteKg";

-- Migration completed successfully
