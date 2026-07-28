-- Dénormalise l'agriculteur sur Pesee pour permettre le reporting/traçabilité
-- sans obliger une jointure via Livraison à chaque requête.
ALTER TABLE "Pesee" ADD COLUMN "agriculteurId" TEXT;

UPDATE "Pesee" p
SET "agriculteurId" = l."agriculteurId"
FROM "Livraison" l
WHERE p."livraisonId" = l.id;

ALTER TABLE "Pesee" ALTER COLUMN "agriculteurId" SET NOT NULL;

CREATE INDEX "Pesee_agriculteurId_idx" ON "Pesee"("agriculteurId");

ALTER TABLE "Pesee" ADD CONSTRAINT "Pesee_agriculteurId_fkey"
    FOREIGN KEY ("agriculteurId") REFERENCES "Agriculteur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
