/*
  Warnings:

  - Added the required column `createdById` to the `BonAchat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `BonSortie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantiteDisponible` to the `StockDate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Vente` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatutPret" AS ENUM ('EN_COURS', 'RETOURNE', 'INCOMPLET');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CREATE_TYPE_DATE';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_TYPE_DATE';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_TYPE_DATE';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_TYPE_CAISSE';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_TYPE_CAISSE';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_TYPE_CAISSE';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_PRET_CAISSE';
ALTER TYPE "AuditAction" ADD VALUE 'RETOUR_PRET_CAISSE';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_BON_ACHAT';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_BON_ACHAT';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_PESEE';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_PESEE';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_STOCK';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_STOCK';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_CONDITIONNEMENT';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_CONDITIONNEMENT';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_CONDITIONNEMENT';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_CLIENT';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_CLIENT';

-- AlterTable
ALTER TABLE "BonAchat" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "BonSortie" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StockDate" ADD COLUMN     "quantiteDisponible" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "regionId" TEXT;

-- AlterTable
ALTER TABLE "Vente" ADD COLUMN     "createdById" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PretCaisse" (
    "id" TEXT NOT NULL,
    "nombrePrete" INTEGER NOT NULL,
    "nombreRetourne" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutPret" NOT NULL DEFAULT 'EN_COURS',
    "datePreT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRetour" TIMESTAMP(3),
    "observations" TEXT,
    "agriculteurId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "livraisonId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PretCaisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conditionnement" (
    "id" TEXT NOT NULL,
    "nombreCaisses" INTEGER NOT NULL,
    "poidsTotal" DOUBLE PRECISION NOT NULL,
    "stockId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conditionnement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PretCaisse_agriculteurId_idx" ON "PretCaisse"("agriculteurId");

-- CreateIndex
CREATE INDEX "PretCaisse_typeCaisseId_idx" ON "PretCaisse"("typeCaisseId");

-- CreateIndex
CREATE INDEX "PretCaisse_livraisonId_idx" ON "PretCaisse"("livraisonId");

-- CreateIndex
CREATE INDEX "PretCaisse_statut_idx" ON "PretCaisse"("statut");

-- CreateIndex
CREATE INDEX "PretCaisse_createdById_idx" ON "PretCaisse"("createdById");

-- CreateIndex
CREATE INDEX "Conditionnement_stockId_idx" ON "Conditionnement"("stockId");

-- CreateIndex
CREATE INDEX "Conditionnement_typeCaisseId_idx" ON "Conditionnement"("typeCaisseId");

-- CreateIndex
CREATE INDEX "Agriculteur_nom_idx" ON "Agriculteur"("nom");

-- CreateIndex
CREATE INDEX "BonAchat_createdById_idx" ON "BonAchat"("createdById");

-- CreateIndex
CREATE INDEX "BonSortie_createdById_idx" ON "BonSortie"("createdById");

-- CreateIndex
CREATE INDEX "Livraison_typeDateId_idx" ON "Livraison"("typeDateId");

-- CreateIndex
CREATE INDEX "Livraison_createdAt_idx" ON "Livraison"("createdAt");

-- CreateIndex
CREATE INDEX "User_regionId_idx" ON "User"("regionId");

-- CreateIndex
CREATE INDEX "Vente_createdById_idx" ON "Vente"("createdById");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PretCaisse" ADD CONSTRAINT "PretCaisse_agriculteurId_fkey" FOREIGN KEY ("agriculteurId") REFERENCES "Agriculteur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PretCaisse" ADD CONSTRAINT "PretCaisse_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PretCaisse" ADD CONSTRAINT "PretCaisse_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "Livraison"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PretCaisse" ADD CONSTRAINT "PretCaisse_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonAchat" ADD CONSTRAINT "BonAchat_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conditionnement" ADD CONSTRAINT "Conditionnement_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "StockDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conditionnement" ADD CONSTRAINT "Conditionnement_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonSortie" ADD CONSTRAINT "BonSortie_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
