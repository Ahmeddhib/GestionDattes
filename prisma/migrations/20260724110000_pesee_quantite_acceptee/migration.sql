-- Ajoute la quantité acceptée (négociable) propre à chaque ligne de pesée,
-- utilisée pour le calcul du montant (prixKg * quantiteAcceptee). Le stock
-- continue d'être basé sur poidsNetTotal (poids net réellement mesuré),
-- inchangé.
ALTER TABLE "Pesee" ADD COLUMN "quantiteAcceptee" DECIMAL(8,2) NOT NULL DEFAULT 0;

-- Backfill : par défaut, la quantité acceptée des pesées existantes est égale
-- au poids net mesuré (pas de négociation historique connue).
UPDATE "Pesee" SET "quantiteAcceptee" = "poidsNetTotal";
