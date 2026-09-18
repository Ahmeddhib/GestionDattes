-- Ajoute la compensation explicite des retours de caisses lies aux pesees.
-- Cette migration reste separee de la migration initiale deja deployee.

ALTER TYPE "TypeMouvementCaisse"
ADD VALUE IF NOT EXISTS 'ANNULATION_RETOUR_AGRICULTEUR';

ALTER TABLE "MouvementCaisse"
DROP CONSTRAINT IF EXISTS "MouvementCaisse_peseeId_fkey";

ALTER TABLE "MouvementCaisse"
ADD CONSTRAINT "MouvementCaisse_peseeId_fkey"
FOREIGN KEY ("peseeId") REFERENCES "Pesee"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
