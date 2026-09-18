-- Conserve la reception de dattes comme trace metier lors d'une annulation.
CREATE TYPE "StatutLivraison" AS ENUM ('VALIDEE', 'ANNULEE');

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CANCEL_LIVRAISON';

ALTER TABLE "Livraison"
ADD COLUMN "statut" "StatutLivraison" NOT NULL DEFAULT 'VALIDEE',
ADD COLUMN "annuleParId" TEXT,
ADD COLUMN "annuleeLe" TIMESTAMP(3),
ADD COLUMN "motifAnnulation" TEXT;

CREATE INDEX "Livraison_statut_idx" ON "Livraison"("statut");
CREATE INDEX "Livraison_annuleParId_idx" ON "Livraison"("annuleParId");

ALTER TABLE "Livraison"
ADD CONSTRAINT "Livraison_annuleParId_fkey"
FOREIGN KEY ("annuleParId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
