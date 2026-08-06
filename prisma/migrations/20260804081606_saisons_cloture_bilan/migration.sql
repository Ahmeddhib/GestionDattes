-- Module Saisons — Phase 2 : clôture et bilan figé.

-- 1. Nouvelle action d'audit pour la clôture d'une saison.
ALTER TYPE "AuditAction" ADD VALUE 'CLOTURER_SAISON';

-- 2. Snapshot figé du bilan d'une saison, créé une seule fois à la clôture,
-- jamais recalculé ni réécrit ensuite.
CREATE TABLE "BilanSaison" (
    "id" TEXT NOT NULL,
    "saisonId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    "nombreLivraisons" INTEGER NOT NULL,
    "totalQuantiteLivree" DOUBLE PRECISION NOT NULL,
    "totalQuantiteAcceptee" DOUBLE PRECISION NOT NULL,

    "totalAchatsMontant" DOUBLE PRECISION NOT NULL,
    "quantitePayable" DOUBLE PRECISION NOT NULL,
    "totalPaiementsAgriculteurs" DOUBLE PRECISION NOT NULL,
    "soldeAgriculteursRestant" DOUBLE PRECISION NOT NULL,

    "totalVentesQuantite" DOUBLE PRECISION NOT NULL,
    "chiffreAffairesVentes" DOUBLE PRECISION NOT NULL,
    "totalEncaissements" DOUBLE PRECISION NOT NULL,
    "creancesClientsRestantes" DOUBLE PRECISION NOT NULL,

    "totalDepensesAutres" DOUBLE PRECISION NOT NULL,

    "tresorerie" DOUBLE PRECISION NOT NULL,
    "margeBrute" DOUBLE PRECISION NOT NULL,
    "margeNette" DOUBLE PRECISION NOT NULL,

    "stockFinalParTypeDate" JSONB NOT NULL,
    "stockCaisses" JSONB NOT NULL,

    "clotureeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clotureeParId" TEXT NOT NULL,

    CONSTRAINT "BilanSaison_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BilanSaison_saisonId_key" ON "BilanSaison"("saisonId");
CREATE INDEX "BilanSaison_tenantId_idx" ON "BilanSaison"("tenantId");

ALTER TABLE "BilanSaison" ADD CONSTRAINT "BilanSaison_saisonId_fkey" FOREIGN KEY ("saisonId") REFERENCES "Saison"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BilanSaison" ADD CONSTRAINT "BilanSaison_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BilanSaison" ADD CONSTRAINT "BilanSaison_clotureeParId_fkey" FOREIGN KEY ("clotureeParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
