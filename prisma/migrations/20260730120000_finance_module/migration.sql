-- Finance module: farmer payments (PaiementAgriculteur), client collections
-- (EncaissementClient), seasons (Saison), other expenses (DepenseAutre),
-- plus statut tracking on BonAchat/Vente. Remaining balances are never
-- persisted (mirrors PretCaisse.nombreRestant), only the statut enum is.

-- CreateEnum
CREATE TYPE "StatutBonAchat" AS ENUM ('EN_ATTENTE', 'PARTIEL', 'PAYE');

-- CreateEnum
CREATE TYPE "StatutVente" AS ENUM ('EN_ATTENTE', 'PARTIEL', 'PAYE');

-- AlterEnum: AuditAction additions
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_SAISON';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_SAISON';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_SAISON';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_PAIEMENT_AGRICULTEUR';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_ENCAISSEMENT_CLIENT';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_DEPENSE_AUTRE';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_DEPENSE_AUTRE';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_DEPENSE_AUTRE';

-- AlterTable: BonAchat
ALTER TABLE "BonAchat" ADD COLUMN "statut" "StatutBonAchat" NOT NULL DEFAULT 'EN_ATTENTE';

-- AlterTable: Vente
ALTER TABLE "Vente" ADD COLUMN "statut" "StatutVente" NOT NULL DEFAULT 'EN_ATTENTE';
ALTER TABLE "Vente" ADD COLUMN "saisonId" TEXT;

-- CreateTable: PaiementAgriculteur
CREATE TABLE "PaiementAgriculteur" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" TEXT,
    "observations" TEXT,
    "bonAchatId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "PaiementAgriculteur_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EncaissementClient
CREATE TABLE "EncaissementClient" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "dateEncaissement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" TEXT,
    "observations" TEXT,
    "venteId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "EncaissementClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Saison
CREATE TABLE "Saison" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Saison_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DepenseAutre
CREATE TABLE "DepenseAutre" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "categorie" TEXT,
    "dateDepense" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observations" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "DepenseAutre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaiementAgriculteur_bonAchatId_idx" ON "PaiementAgriculteur"("bonAchatId");
CREATE INDEX "PaiementAgriculteur_createdById_idx" ON "PaiementAgriculteur"("createdById");
CREATE INDEX "PaiementAgriculteur_tenantId_idx" ON "PaiementAgriculteur"("tenantId");
CREATE INDEX "PaiementAgriculteur_datePaiement_idx" ON "PaiementAgriculteur"("datePaiement");

CREATE INDEX "EncaissementClient_venteId_idx" ON "EncaissementClient"("venteId");
CREATE INDEX "EncaissementClient_createdById_idx" ON "EncaissementClient"("createdById");
CREATE INDEX "EncaissementClient_tenantId_idx" ON "EncaissementClient"("tenantId");
CREATE INDEX "EncaissementClient_dateEncaissement_idx" ON "EncaissementClient"("dateEncaissement");

CREATE UNIQUE INDEX "Saison_tenantId_nom_key" ON "Saison"("tenantId", "nom");
CREATE INDEX "Saison_tenantId_idx" ON "Saison"("tenantId");
CREATE INDEX "Saison_dateDebut_idx" ON "Saison"("dateDebut");
CREATE INDEX "Saison_dateFin_idx" ON "Saison"("dateFin");

CREATE INDEX "DepenseAutre_createdById_idx" ON "DepenseAutre"("createdById");
CREATE INDEX "DepenseAutre_tenantId_idx" ON "DepenseAutre"("tenantId");
CREATE INDEX "DepenseAutre_dateDepense_idx" ON "DepenseAutre"("dateDepense");

CREATE INDEX "Vente_saisonId_idx" ON "Vente"("saisonId");

-- AddForeignKey
ALTER TABLE "PaiementAgriculteur" ADD CONSTRAINT "PaiementAgriculteur_bonAchatId_fkey" FOREIGN KEY ("bonAchatId") REFERENCES "BonAchat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaiementAgriculteur" ADD CONSTRAINT "PaiementAgriculteur_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaiementAgriculteur" ADD CONSTRAINT "PaiementAgriculteur_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EncaissementClient" ADD CONSTRAINT "EncaissementClient_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "Vente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EncaissementClient" ADD CONSTRAINT "EncaissementClient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EncaissementClient" ADD CONSTRAINT "EncaissementClient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Saison" ADD CONSTRAINT "Saison_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Saison" ADD CONSTRAINT "Saison_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DepenseAutre" ADD CONSTRAINT "DepenseAutre_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepenseAutre" ADD CONSTRAINT "DepenseAutre_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Vente" ADD CONSTRAINT "Vente_saisonId_fkey" FOREIGN KEY ("saisonId") REFERENCES "Saison"("id") ON DELETE SET NULL ON UPDATE CASCADE;
