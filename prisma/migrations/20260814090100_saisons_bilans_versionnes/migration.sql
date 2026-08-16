-- Bilans de saison versionnés : PROVISOIRE (répétable, ne verrouille rien)
-- vs FINAL (créé une seule fois, à la clôture).
--
-- Jusqu'ici BilanSaison.saisonId était @unique : il ne pouvait exister qu'un
-- seul bilan par saison, produit exclusivement par la transaction de clôture.
-- Générer un bilan revenait donc forcément à fermer la campagne.

-- 1. Enum discriminant + numéro de version
CREATE TYPE "TypeBilanSaison" AS ENUM ('PROVISOIRE', 'FINAL');

ALTER TABLE "BilanSaison" ADD COLUMN "type" "TypeBilanSaison";
ALTER TABLE "BilanSaison" ADD COLUMN "version" INTEGER;

-- 2. Rétro-remplissage : tout bilan déjà en base est LE bilan de clôture.
UPDATE "BilanSaison" SET "type" = 'FINAL', "version" = 1;

ALTER TABLE "BilanSaison" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "BilanSaison" ALTER COLUMN "type" SET DEFAULT 'PROVISOIRE';
ALTER TABLE "BilanSaison" ALTER COLUMN "version" SET NOT NULL;

-- 3. Renommage des métadonnées de génération : « clôturée le / par » n'a plus
--    de sens pour un bilan provisoire. RENAME préserve les données.
ALTER TABLE "BilanSaison" RENAME COLUMN "clotureeAt" TO "genereAt";
ALTER TABLE "BilanSaison" RENAME COLUMN "clotureeParId" TO "genereParId";
ALTER TABLE "BilanSaison" RENAME CONSTRAINT "BilanSaison_clotureeParId_fkey"
                                         TO "BilanSaison_genereParId_fkey";

-- 4. Nouveaux agrégats de stock attribuables à la saison. Les bilans
--    historiques n'en disposent pas : ils restent à '[]'.
ALTER TABLE "BilanSaison" ADD COLUMN "stockEntreParTypeDate"          JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "BilanSaison" ADD COLUMN "stockOrigineRestantParTypeDate" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "BilanSaison" ADD COLUMN "caissesSaison"                  JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 5. Lever la contrainte « un seul bilan par saison », la remplacer par
--    l'unicité du couple (saison, version).
DROP INDEX "BilanSaison_saisonId_key";
CREATE UNIQUE INDEX "BilanSaison_saisonId_version_key" ON "BilanSaison"("saisonId", "version");
CREATE INDEX "BilanSaison_tenantId_saisonId_idx" ON "BilanSaison"("tenantId", "saisonId");
CREATE INDEX "BilanSaison_saisonId_type_idx" ON "BilanSaison"("saisonId", "type");

-- 6. Un seul bilan FINAL par saison, à jamais. Index partiel : inexprimable
--    dans schema.prisma, même motif que Saison_one_open_per_tenant posé par
--    la migration 20260804064645_saisons_socle.
CREATE UNIQUE INDEX "BilanSaison_one_final_per_saison"
    ON "BilanSaison"("saisonId") WHERE "type" = 'FINAL';

-- 7. Métadonnées de clôture promues sur la Saison elle-même : jusqu'ici
--    « qui a clôturé, et quand » n'était lisible qu'indirectement via le
--    bilan.
ALTER TABLE "Saison" ADD COLUMN "clotureeAt" TIMESTAMP(3);
ALTER TABLE "Saison" ADD COLUMN "clotureeParId" TEXT;

UPDATE "Saison" s
   SET "clotureeAt" = b."genereAt",
       "clotureeParId" = b."genereParId"
  FROM "BilanSaison" b
 WHERE b."saisonId" = s."id" AND b."type" = 'FINAL';

ALTER TABLE "Saison" ADD CONSTRAINT "Saison_clotureeParId_fkey"
    FOREIGN KEY ("clotureeParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Saison_clotureeParId_idx" ON "Saison"("clotureeParId");
