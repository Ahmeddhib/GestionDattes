-- Livreur facultatif sur un prêt de caisses : information de traçabilité
-- uniquement (qui a livré/repris les caisses), sans impact sur les calculs
-- de stock (nombrePrete / nombreRetourne).
ALTER TABLE "PretCaisse" ADD COLUMN "livreurId" TEXT;

ALTER TABLE "PretCaisse" ADD CONSTRAINT "PretCaisse_livreurId_fkey"
    FOREIGN KEY ("livreurId") REFERENCES "Livreur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PretCaisse_livreurId_idx" ON "PretCaisse"("livreurId");
