-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENT_RECEPTION', 'LABORANTIN', 'RESPONSABLE_STOCK', 'DIRECTION');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE_USER', 'UPDATE_USER', 'ACTIVATE_USER', 'DEACTIVATE_USER', 'CHANGE_ROLE', 'CREATE_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'CREATE_REGION', 'UPDATE_REGION', 'DELETE_REGION', 'CREATE_AGRICULTEUR', 'UPDATE_AGRICULTEUR', 'DELETE_AGRICULTEUR', 'CREATE_LIVRAISON', 'UPDATE_LIVRAISON', 'DELETE_LIVRAISON', 'CREATE_VENTE', 'UPDATE_VENTE', 'DELETE_VENTE', 'CREATE_BON_SORTIE', 'UPDATE_BON_SORTIE', 'DELETE_BON_SORTIE');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT_RECEPTION',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT,
    "action" "AuditAction" NOT NULL,
    "description" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeDate" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeCaisse" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "poidsKg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeCaisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agriculteur" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "cin" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse" TEXT,
    "nbPalmiers" INTEGER NOT NULL,
    "superficie" DOUBLE PRECISION,
    "productionEstimee" DOUBLE PRECISION,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agriculteur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livraison" (
    "id" TEXT NOT NULL,
    "numeroLot" TEXT NOT NULL,
    "dateLivraison" TIMESTAMP(3) NOT NULL,
    "quantiteKg" DOUBLE PRECISION NOT NULL,
    "agriculteurId" TEXT NOT NULL,
    "typeDateId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Livraison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonAchat" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "prixKg" DOUBLE PRECISION NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "livraisonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonAchat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pesee" (
    "id" TEXT NOT NULL,
    "poidsBrut" DOUBLE PRECISION NOT NULL,
    "poidsNet" DOUBLE PRECISION NOT NULL,
    "tare" DOUBLE PRECISION,
    "livraisonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pesee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Echantillon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "livraisonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Echantillon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analyse" (
    "id" TEXT NOT NULL,
    "echantillonId" TEXT NOT NULL,
    "dateAnalyse" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "humidite" DOUBLE PRECISION,
    "tauxSucre" DOUBLE PRECISION,
    "calibre" TEXT,
    "qualite" TEXT,
    "observations" TEXT,
    "conforme" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analyse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockDate" (
    "id" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "dateEntree" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "typeDateId" TEXT NOT NULL,
    "livraisonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vente" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantite" DOUBLE PRECISION NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "clientId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonSortie" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dateSortie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantiteTotale" DOUBLE PRECISION NOT NULL,
    "stockId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonSortie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- CreateIndex
CREATE INDEX "Region_code_idx" ON "Region"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TypeDate_nom_key" ON "TypeDate"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "TypeCaisse_nom_key" ON "TypeCaisse"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Agriculteur_code_key" ON "Agriculteur"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Agriculteur_cin_key" ON "Agriculteur"("cin");

-- CreateIndex
CREATE INDEX "Agriculteur_code_idx" ON "Agriculteur"("code");

-- CreateIndex
CREATE INDEX "Agriculteur_cin_idx" ON "Agriculteur"("cin");

-- CreateIndex
CREATE INDEX "Agriculteur_regionId_idx" ON "Agriculteur"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Livraison_numeroLot_key" ON "Livraison"("numeroLot");

-- CreateIndex
CREATE INDEX "Livraison_numeroLot_idx" ON "Livraison"("numeroLot");

-- CreateIndex
CREATE INDEX "Livraison_agriculteurId_idx" ON "Livraison"("agriculteurId");

-- CreateIndex
CREATE INDEX "Livraison_dateLivraison_idx" ON "Livraison"("dateLivraison");

-- CreateIndex
CREATE UNIQUE INDEX "BonAchat_numero_key" ON "BonAchat"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "BonAchat_livraisonId_key" ON "BonAchat"("livraisonId");

-- CreateIndex
CREATE INDEX "BonAchat_numero_idx" ON "BonAchat"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Pesee_livraisonId_key" ON "Pesee"("livraisonId");

-- CreateIndex
CREATE UNIQUE INDEX "Echantillon_code_key" ON "Echantillon"("code");

-- CreateIndex
CREATE INDEX "Echantillon_code_idx" ON "Echantillon"("code");

-- CreateIndex
CREATE INDEX "Echantillon_livraisonId_idx" ON "Echantillon"("livraisonId");

-- CreateIndex
CREATE INDEX "Analyse_echantillonId_idx" ON "Analyse"("echantillonId");

-- CreateIndex
CREATE INDEX "Analyse_dateAnalyse_idx" ON "Analyse"("dateAnalyse");

-- CreateIndex
CREATE INDEX "StockDate_typeDateId_idx" ON "StockDate"("typeDateId");

-- CreateIndex
CREATE INDEX "StockDate_livraisonId_idx" ON "StockDate"("livraisonId");

-- CreateIndex
CREATE INDEX "StockDate_dateEntree_idx" ON "StockDate"("dateEntree");

-- CreateIndex
CREATE INDEX "Client_nom_idx" ON "Client"("nom");

-- CreateIndex
CREATE INDEX "Vente_clientId_idx" ON "Vente"("clientId");

-- CreateIndex
CREATE INDEX "Vente_stockId_idx" ON "Vente"("stockId");

-- CreateIndex
CREATE INDEX "Vente_date_idx" ON "Vente"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BonSortie_numero_key" ON "BonSortie"("numero");

-- CreateIndex
CREATE INDEX "BonSortie_numero_idx" ON "BonSortie"("numero");

-- CreateIndex
CREATE INDEX "BonSortie_stockId_idx" ON "BonSortie"("stockId");

-- CreateIndex
CREATE INDEX "BonSortie_dateSortie_idx" ON "BonSortie"("dateSortie");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agriculteur" ADD CONSTRAINT "Agriculteur_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livraison" ADD CONSTRAINT "Livraison_agriculteurId_fkey" FOREIGN KEY ("agriculteurId") REFERENCES "Agriculteur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livraison" ADD CONSTRAINT "Livraison_typeDateId_fkey" FOREIGN KEY ("typeDateId") REFERENCES "TypeDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livraison" ADD CONSTRAINT "Livraison_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonAchat" ADD CONSTRAINT "BonAchat_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "Livraison"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesee" ADD CONSTRAINT "Pesee_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "Livraison"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Echantillon" ADD CONSTRAINT "Echantillon_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "Livraison"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analyse" ADD CONSTRAINT "Analyse_echantillonId_fkey" FOREIGN KEY ("echantillonId") REFERENCES "Echantillon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDate" ADD CONSTRAINT "StockDate_typeDateId_fkey" FOREIGN KEY ("typeDateId") REFERENCES "TypeDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDate" ADD CONSTRAINT "StockDate_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "Livraison"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "StockDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonSortie" ADD CONSTRAINT "BonSortie_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "StockDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonSortie" ADD CONSTRAINT "BonSortie_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
