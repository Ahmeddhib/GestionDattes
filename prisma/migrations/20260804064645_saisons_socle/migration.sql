-- Module Saisons — socle : chaque opération métier appartient obligatoirement
-- à une saison (OUVERTE ou CLOTUREE), une seule OUVERTE par tenant.

-- 1. Enum de statut + migration du booléen "active" existant
CREATE TYPE "StatutSaison" AS ENUM ('OUVERTE', 'CLOTUREE');

ALTER TABLE "Saison" ADD COLUMN "statut" "StatutSaison";
UPDATE "Saison" SET "statut" = CASE WHEN "active" THEN 'OUVERTE'::"StatutSaison" ELSE 'CLOTUREE'::"StatutSaison" END;
ALTER TABLE "Saison" ALTER COLUMN "statut" SET NOT NULL;
ALTER TABLE "Saison" ALTER COLUMN "statut" SET DEFAULT 'OUVERTE';
ALTER TABLE "Saison" DROP COLUMN "active";

-- 2. Si un tenant a fini avec plusieurs saisons OUVERTE (aucune contrainte ne
-- l'empêchait), ne garder que la plus récente comme OUVERTE.
WITH ranked AS (
  SELECT id, "tenantId",
         ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "createdAt" DESC) AS rn
  FROM "Saison"
  WHERE "statut" = 'OUVERTE'
)
UPDATE "Saison" s
SET "statut" = 'CLOTUREE'
FROM ranked r
WHERE s.id = r.id AND r.rn > 1;

-- 3. Bootstrap : chaque tenant sans AUCUNE saison reçoit une saison OUVERTE
-- par défaut (utilisée immédiatement pour toute nouvelle opération).
INSERT INTO "Saison" (id, nom, "dateDebut", "dateFin", statut, "tenantId", "createdById", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Saison ' || EXTRACT(YEAR FROM now())::text || '-' || (EXTRACT(YEAR FROM now())::int + 1)::text,
  date_trunc('year', now()),
  date_trunc('year', now()) + interval '1 year' - interval '1 day',
  'OUVERTE',
  t.id,
  (SELECT tu."userId" FROM "TenantUser" tu JOIN "Role" r ON r.id = tu."roleId"
   WHERE tu."tenantId" = t.id AND r.name = 'ADMIN' ORDER BY tu."createdAt" ASC LIMIT 1),
  now(),
  now()
FROM "Tenant" t
WHERE NOT EXISTS (SELECT 1 FROM "Saison" s WHERE s."tenantId" = t.id)
  AND EXISTS (SELECT 1 FROM "TenantUser" tu JOIN "Role" r ON r.id = tu."roleId" WHERE tu."tenantId" = t.id AND r.name = 'ADMIN');

-- 4. Ajout des colonnes saisonId (nullable pour l'instant, sur les 5 tables
-- qui n'en avaient pas encore).
ALTER TABLE "Livraison" ADD COLUMN "saisonId" TEXT;
ALTER TABLE "BonAchat" ADD COLUMN "saisonId" TEXT;
ALTER TABLE "PaiementAgriculteur" ADD COLUMN "saisonId" TEXT;
ALTER TABLE "EncaissementClient" ADD COLUMN "saisonId" TEXT;
ALTER TABLE "DepenseAutre" ADD COLUMN "saisonId" TEXT;

-- 5. Pour chaque tenant ayant des données historiques (créées avant ce
-- module), créer une saison "Historique" CLOTUREE dédiée et y rattacher
-- toutes les lignes existantes qui n'ont pas encore de saisonId — jamais
-- mélangées avec la saison OUVERTE courante.
INSERT INTO "Saison" (id, nom, "dateDebut", "dateFin", statut, "tenantId", "createdById", "createdAt", "updatedAt")
SELECT
  'hist_' || t.id,
  'Historique (avant module Saisons)',
  COALESCE(
    (SELECT MIN(d) FROM (
      SELECT MIN("dateLivraison") AS d FROM "Livraison" WHERE "tenantId" = t.id
      UNION ALL SELECT MIN(date) FROM "Vente" WHERE "tenantId" = t.id
    ) x), now()
  ),
  COALESCE(
    (SELECT MAX(d) FROM (
      SELECT MAX("dateLivraison") AS d FROM "Livraison" WHERE "tenantId" = t.id
      UNION ALL SELECT MAX(date) FROM "Vente" WHERE "tenantId" = t.id
    ) x), now()
  ),
  'CLOTUREE',
  t.id,
  (SELECT tu."userId" FROM "TenantUser" tu JOIN "Role" r ON r.id = tu."roleId"
   WHERE tu."tenantId" = t.id AND r.name = 'ADMIN' ORDER BY tu."createdAt" ASC LIMIT 1),
  now(),
  now()
FROM "Tenant" t
WHERE EXISTS (
  SELECT 1 FROM "Livraison" WHERE "tenantId" = t.id
  UNION ALL SELECT 1 FROM "Vente" WHERE "tenantId" = t.id AND "saisonId" IS NULL
  UNION ALL SELECT 1 FROM "BonAchat" WHERE "tenantId" = t.id
  UNION ALL SELECT 1 FROM "PaiementAgriculteur" WHERE "tenantId" = t.id
  UNION ALL SELECT 1 FROM "EncaissementClient" WHERE "tenantId" = t.id
  UNION ALL SELECT 1 FROM "DepenseAutre" WHERE "tenantId" = t.id
);

UPDATE "Livraison" l SET "saisonId" = 'hist_' || l."tenantId" WHERE l."saisonId" IS NULL;
UPDATE "BonAchat" b SET "saisonId" = 'hist_' || b."tenantId" WHERE b."saisonId" IS NULL;
UPDATE "PaiementAgriculteur" p SET "saisonId" = 'hist_' || p."tenantId" WHERE p."saisonId" IS NULL;
UPDATE "EncaissementClient" e SET "saisonId" = 'hist_' || e."tenantId" WHERE e."saisonId" IS NULL;
UPDATE "DepenseAutre" d SET "saisonId" = 'hist_' || d."tenantId" WHERE d."saisonId" IS NULL;
UPDATE "Vente" v SET "saisonId" = 'hist_' || v."tenantId" WHERE v."saisonId" IS NULL;

-- 6. saisonId devient obligatoire partout.
ALTER TABLE "Livraison" ALTER COLUMN "saisonId" SET NOT NULL;
ALTER TABLE "BonAchat" ALTER COLUMN "saisonId" SET NOT NULL;
ALTER TABLE "PaiementAgriculteur" ALTER COLUMN "saisonId" SET NOT NULL;
ALTER TABLE "EncaissementClient" ALTER COLUMN "saisonId" SET NOT NULL;
ALTER TABLE "DepenseAutre" ALTER COLUMN "saisonId" SET NOT NULL;
ALTER TABLE "Vente" ALTER COLUMN "saisonId" SET NOT NULL;

-- 7. Clés étrangères + index.
ALTER TABLE "Livraison" ADD CONSTRAINT "Livraison_saisonId_fkey" FOREIGN KEY ("saisonId") REFERENCES "Saison"("id");
ALTER TABLE "BonAchat" ADD CONSTRAINT "BonAchat_saisonId_fkey" FOREIGN KEY ("saisonId") REFERENCES "Saison"("id");
ALTER TABLE "PaiementAgriculteur" ADD CONSTRAINT "PaiementAgriculteur_saisonId_fkey" FOREIGN KEY ("saisonId") REFERENCES "Saison"("id");
ALTER TABLE "EncaissementClient" ADD CONSTRAINT "EncaissementClient_saisonId_fkey" FOREIGN KEY ("saisonId") REFERENCES "Saison"("id");
ALTER TABLE "DepenseAutre" ADD CONSTRAINT "DepenseAutre_saisonId_fkey" FOREIGN KEY ("saisonId") REFERENCES "Saison"("id");

CREATE INDEX "Livraison_saisonId_idx" ON "Livraison"("saisonId");
CREATE INDEX "BonAchat_saisonId_idx" ON "BonAchat"("saisonId");
CREATE INDEX "PaiementAgriculteur_saisonId_idx" ON "PaiementAgriculteur"("saisonId");
CREATE INDEX "EncaissementClient_saisonId_idx" ON "EncaissementClient"("saisonId");
CREATE INDEX "DepenseAutre_saisonId_idx" ON "DepenseAutre"("saisonId");
CREATE INDEX "Saison_statut_idx" ON "Saison"("statut");

-- 8. Une seule saison OUVERTE par tenant (contrainte forte au niveau DB).
CREATE UNIQUE INDEX "Saison_one_open_per_tenant" ON "Saison"("tenantId") WHERE "statut" = 'OUVERTE';
