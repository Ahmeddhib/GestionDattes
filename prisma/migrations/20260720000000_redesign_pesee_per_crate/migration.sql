-- Crate-level tare configuration
ALTER TABLE "TypeCaisse" ADD COLUMN "tare" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Preserve legacy single-measurement rows under a temp name before rebuilding Pesee
ALTER TABLE "Pesee" DROP CONSTRAINT IF EXISTS "Pesee_livraisonId_fkey";
ALTER TABLE "Pesee" DROP CONSTRAINT IF EXISTS "Pesee_tenantId_fkey";
ALTER TABLE "Pesee" RENAME TO "Pesee_old";

-- Renaming a table does not rename its constraints/indexes; free up their
-- names so the rebuilt "Pesee" table below can reuse them
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname FROM pg_constraint WHERE conrelid = '"Pesee_old"'::regclass
    LOOP
        EXECUTE format('ALTER TABLE "Pesee_old" RENAME CONSTRAINT %I TO %I', r.conname, r.conname || '_old');
    END LOOP;

    FOR r IN
        SELECT indexname FROM pg_indexes WHERE tablename = 'Pesee_old'
    LOOP
        EXECUTE format('ALTER INDEX %I RENAME TO %I', r.indexname, r.indexname || '_old');
    END LOOP;
END $$;

-- Pesee becomes a per-crate-type weighing session for a delivery
CREATE TABLE "Pesee" (
    "id" TEXT NOT NULL,
    "livraisonId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "tareKg" DECIMAL(6,2) NOT NULL,
    "nombreCaisses" INTEGER NOT NULL,
    "poidsBrutTotal" DECIMAL(8,2) NOT NULL,
    "poidsTareTotal" DECIMAL(8,2) NOT NULL,
    "poidsNetTotal" DECIMAL(8,2) NOT NULL,
    "poidsBrutMoyen" DECIMAL(6,2) NOT NULL,
    "poidsNetMoyen" DECIMAL(6,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Pesee_pkey" PRIMARY KEY ("id")
);

-- Individual crate readings that make up a Pesee session
CREATE TABLE "PeseeCaisse" (
    "id" TEXT NOT NULL,
    "peseeId" TEXT NOT NULL,
    "poidsBrut" DECIMAL(6,2) NOT NULL,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "PeseeCaisse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Pesee_livraisonId_typeCaisseId_key" ON "Pesee"("livraisonId", "typeCaisseId");
CREATE INDEX "Pesee_livraisonId_idx" ON "Pesee"("livraisonId");
CREATE INDEX "Pesee_typeCaisseId_idx" ON "Pesee"("typeCaisseId");
CREATE INDEX "Pesee_tenantId_idx" ON "Pesee"("tenantId");
CREATE INDEX "PeseeCaisse_peseeId_idx" ON "PeseeCaisse"("peseeId");

ALTER TABLE "Pesee" ADD CONSTRAINT "Pesee_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "Livraison"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pesee" ADD CONSTRAINT "Pesee_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pesee" ADD CONSTRAINT "Pesee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeseeCaisse" ADD CONSTRAINT "PeseeCaisse_peseeId_fkey" FOREIGN KEY ("peseeId") REFERENCES "Pesee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate each legacy aggregate measurement into the first crate type used on its delivery
INSERT INTO "Pesee" (
    "id", "livraisonId", "typeCaisseId", "tareKg", "nombreCaisses",
    "poidsBrutTotal", "poidsTareTotal", "poidsNetTotal", "poidsBrutMoyen", "poidsNetMoyen",
    "createdAt", "tenantId"
)
SELECT
    po."id",
    po."livraisonId",
    first_ltc."typeCaisseId",
    COALESCE(po."tare", 0),
    1,
    po."poidsBrut",
    COALESCE(po."tare", 0),
    po."poidsNet",
    po."poidsBrut",
    po."poidsNet",
    po."createdAt",
    po."tenantId"
FROM "Pesee_old" po
INNER JOIN LATERAL (
    SELECT ltc."typeCaisseId"
    FROM "LivraisonTypeCaisse" ltc
    WHERE ltc."livraisonId" = po."livraisonId"
    ORDER BY ltc."createdAt" ASC
    LIMIT 1
) first_ltc ON true;

INSERT INTO "PeseeCaisse" ("id", "peseeId", "poidsBrut", "ordre")
SELECT po."id" || '_c1', po."id", po."poidsBrut", 1
FROM "Pesee_old" po
WHERE EXISTS (SELECT 1 FROM "Pesee" p WHERE p."id" = po."id");

DROP TABLE "Pesee_old";
