ALTER TABLE "Livraison"
  ADD COLUMN "quantiteLivree" DOUBLE PRECISION,
  ADD COLUMN "quantiteAcceptee" DOUBLE PRECISION;

UPDATE "Livraison" l
SET
  "quantiteLivree" = COALESCE((
    SELECT SUM(ltc.quantite * tc."poidsKg")
    FROM "LivraisonTypeCaisse" ltc
    JOIN "TypeCaisse" tc ON tc.id = ltc."typeCaisseId"
    WHERE ltc."livraisonId" = l.id
  ), 0),
  "quantiteAcceptee" = COALESCE((
    SELECT SUM(ltc.quantite * tc."poidsKg")
    FROM "LivraisonTypeCaisse" ltc
    JOIN "TypeCaisse" tc ON tc.id = ltc."typeCaisseId"
    WHERE ltc."livraisonId" = l.id
  ), 0);

ALTER TABLE "Livraison"
  ALTER COLUMN "quantiteLivree" SET NOT NULL,
  ALTER COLUMN "quantiteAcceptee" SET NOT NULL;
