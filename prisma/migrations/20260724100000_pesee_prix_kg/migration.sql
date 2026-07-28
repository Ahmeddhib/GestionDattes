-- Ajoute le prix au kg propre à chaque ligne de pesée (type de datte), pour
-- permettre un calcul et un affichage du montant par ligne au lieu d'un prix
-- global unique par livraison.
ALTER TABLE "Pesee" ADD COLUMN "prixKg" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill des pesées existantes avec le prix moyen du bon d'achat de leur
-- livraison (meilleure approximation disponible pour les données historiques).
UPDATE "Pesee" p
SET "prixKg" = ba."prixKg"
FROM "BonAchat" ba
WHERE ba."livraisonId" = p."livraisonId";
