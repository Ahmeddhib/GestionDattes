-- Architecture additive du stock de caisses : propriété, réceptions et ledger.
-- L'ancien TypeCaisse.stockDisponible est conservé temporairement pour permettre
-- une transition sans perte de données. Sa valeur est copiée vers le stock Wakala.

CREATE TYPE "ProprietaireCaisse" AS ENUM ('WAKALA', 'CLIENT');
CREATE TYPE "DirectionMouvementCaisse" AS ENUM ('ENTREE', 'SORTIE');
CREATE TYPE "TypeMouvementCaisse" AS ENUM (
    'RECEPTION_CLIENT',
    'ANNULATION_RECEPTION',
    'SORTIE_VENTE',
    'PRET_AGRICULTEUR',
    'RETOUR_AGRICULTEUR',
    'AJUSTEMENT'
);
CREATE TYPE "StatutReceptionCaisses" AS ENUM ('VALIDEE', 'ANNULEE');

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CREATE_RECEPTION_CAISSES';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CANCEL_RECEPTION_CAISSES';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADJUST_STOCK_CAISSES';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CREATE_MOUVEMENT_CAISSE';

CREATE TABLE "StockCaisseWakala" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockCaisseWakala_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StockCaisseWakala_quantite_check" CHECK ("quantite" >= 0)
);

CREATE TABLE "StockCaisseClient" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockCaisseClient_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StockCaisseClient_quantite_check" CHECK ("quantite" >= 0)
);

CREATE TABLE "ReceptionCaisses" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matriculeCamion" TEXT,
    "chauffeur" TEXT,
    "observations" TEXT,
    "statut" "StatutReceptionCaisses" NOT NULL DEFAULT 'VALIDEE',
    "createdById" TEXT NOT NULL,
    "annuleParId" TEXT,
    "annuleeLe" TIMESTAMP(3),
    "motifAnnulation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReceptionCaisses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReceptionCaissesLigne" (
    "id" TEXT NOT NULL,
    "receptionId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    CONSTRAINT "ReceptionCaissesLigne_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReceptionCaissesLigne_quantite_check" CHECK ("quantite" > 0)
);

CREATE TABLE "MouvementCaisse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "proprietaire" "ProprietaireCaisse" NOT NULL,
    "clientProprietaireId" TEXT,
    "type" "TypeMouvementCaisse" NOT NULL,
    "direction" "DirectionMouvementCaisse" NOT NULL,
    "quantite" INTEGER NOT NULL,
    "receptionId" TEXT,
    "venteId" TEXT,
    "pretCaisseId" TEXT,
    "peseeId" TEXT,
    "reference" TEXT,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MouvementCaisse_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MouvementCaisse_quantite_check" CHECK ("quantite" > 0),
    CONSTRAINT "MouvementCaisse_proprietaire_check" CHECK (
        ("proprietaire" = 'WAKALA' AND "clientProprietaireId" IS NULL)
        OR ("proprietaire" = 'CLIENT' AND "clientProprietaireId" IS NOT NULL)
    )
);

CREATE TABLE "VenteCaisse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "venteId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "proprietaire" "ProprietaireCaisse" NOT NULL,
    "clientProprietaireId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VenteCaisse_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VenteCaisse_quantite_check" CHECK ("quantite" > 0),
    CONSTRAINT "VenteCaisse_proprietaire_check" CHECK (
        ("proprietaire" = 'WAKALA' AND "clientProprietaireId" IS NULL)
        OR ("proprietaire" = 'CLIENT' AND "clientProprietaireId" IS NOT NULL)
    )
);

CREATE TABLE "PretCaisseSource" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pretCaisseId" TEXT NOT NULL,
    "typeCaisseId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "quantiteRetournee" INTEGER NOT NULL DEFAULT 0,
    "proprietaire" "ProprietaireCaisse" NOT NULL,
    "clientProprietaireId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PretCaisseSource_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PretCaisseSource_quantite_check" CHECK ("quantite" > 0),
    CONSTRAINT "PretCaisseSource_retour_check" CHECK (
        "quantiteRetournee" >= 0 AND "quantiteRetournee" <= "quantite"
    ),
    CONSTRAINT "PretCaisseSource_proprietaire_check" CHECK (
        ("proprietaire" = 'WAKALA' AND "clientProprietaireId" IS NULL)
        OR ("proprietaire" = 'CLIENT' AND "clientProprietaireId" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "StockCaisseWakala_tenantId_typeCaisseId_key" ON "StockCaisseWakala"("tenantId", "typeCaisseId");
CREATE INDEX "StockCaisseWakala_tenantId_idx" ON "StockCaisseWakala"("tenantId");
CREATE INDEX "StockCaisseWakala_typeCaisseId_idx" ON "StockCaisseWakala"("typeCaisseId");
CREATE UNIQUE INDEX "StockCaisseClient_tenantId_clientId_typeCaisseId_key" ON "StockCaisseClient"("tenantId", "clientId", "typeCaisseId");
CREATE INDEX "StockCaisseClient_tenantId_idx" ON "StockCaisseClient"("tenantId");
CREATE INDEX "StockCaisseClient_clientId_idx" ON "StockCaisseClient"("clientId");
CREATE INDEX "StockCaisseClient_typeCaisseId_idx" ON "StockCaisseClient"("typeCaisseId");
CREATE UNIQUE INDEX "ReceptionCaisses_tenantId_numero_key" ON "ReceptionCaisses"("tenantId", "numero");
CREATE INDEX "ReceptionCaisses_tenantId_date_idx" ON "ReceptionCaisses"("tenantId", "date");
CREATE INDEX "ReceptionCaisses_clientId_idx" ON "ReceptionCaisses"("clientId");
CREATE INDEX "ReceptionCaisses_statut_idx" ON "ReceptionCaisses"("statut");
CREATE UNIQUE INDEX "ReceptionCaissesLigne_receptionId_typeCaisseId_key" ON "ReceptionCaissesLigne"("receptionId", "typeCaisseId");
CREATE INDEX "ReceptionCaissesLigne_receptionId_idx" ON "ReceptionCaissesLigne"("receptionId");
CREATE INDEX "ReceptionCaissesLigne_typeCaisseId_idx" ON "ReceptionCaissesLigne"("typeCaisseId");
CREATE INDEX "MouvementCaisse_tenantId_createdAt_idx" ON "MouvementCaisse"("tenantId", "createdAt");
CREATE INDEX "MouvementCaisse_tenantId_type_createdAt_idx" ON "MouvementCaisse"("tenantId", "type", "createdAt");
CREATE INDEX "MouvementCaisse_tenantId_typeCaisseId_createdAt_idx" ON "MouvementCaisse"("tenantId", "typeCaisseId", "createdAt");
CREATE INDEX "MouvementCaisse_tenantId_clientProprietaireId_createdAt_idx" ON "MouvementCaisse"("tenantId", "clientProprietaireId", "createdAt");
CREATE INDEX "MouvementCaisse_receptionId_idx" ON "MouvementCaisse"("receptionId");
CREATE INDEX "MouvementCaisse_venteId_idx" ON "MouvementCaisse"("venteId");
CREATE INDEX "MouvementCaisse_pretCaisseId_idx" ON "MouvementCaisse"("pretCaisseId");
CREATE INDEX "MouvementCaisse_peseeId_idx" ON "MouvementCaisse"("peseeId");
CREATE INDEX "VenteCaisse_tenantId_idx" ON "VenteCaisse"("tenantId");
CREATE INDEX "VenteCaisse_venteId_idx" ON "VenteCaisse"("venteId");
CREATE INDEX "VenteCaisse_typeCaisseId_idx" ON "VenteCaisse"("typeCaisseId");
CREATE INDEX "VenteCaisse_clientProprietaireId_idx" ON "VenteCaisse"("clientProprietaireId");
CREATE INDEX "PretCaisseSource_tenantId_idx" ON "PretCaisseSource"("tenantId");
CREATE INDEX "PretCaisseSource_pretCaisseId_idx" ON "PretCaisseSource"("pretCaisseId");
CREATE INDEX "PretCaisseSource_typeCaisseId_idx" ON "PretCaisseSource"("typeCaisseId");
CREATE INDEX "PretCaisseSource_clientProprietaireId_idx" ON "PretCaisseSource"("clientProprietaireId");

ALTER TABLE "StockCaisseWakala" ADD CONSTRAINT "StockCaisseWakala_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockCaisseWakala" ADD CONSTRAINT "StockCaisseWakala_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockCaisseClient" ADD CONSTRAINT "StockCaisseClient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockCaisseClient" ADD CONSTRAINT "StockCaisseClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockCaisseClient" ADD CONSTRAINT "StockCaisseClient_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReceptionCaisses" ADD CONSTRAINT "ReceptionCaisses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReceptionCaisses" ADD CONSTRAINT "ReceptionCaisses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReceptionCaisses" ADD CONSTRAINT "ReceptionCaisses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReceptionCaisses" ADD CONSTRAINT "ReceptionCaisses_annuleParId_fkey" FOREIGN KEY ("annuleParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReceptionCaissesLigne" ADD CONSTRAINT "ReceptionCaissesLigne_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "ReceptionCaisses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReceptionCaissesLigne" ADD CONSTRAINT "ReceptionCaissesLigne_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MouvementCaisse" ADD CONSTRAINT "MouvementCaisse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MouvementCaisse" ADD CONSTRAINT "MouvementCaisse_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MouvementCaisse" ADD CONSTRAINT "MouvementCaisse_clientProprietaireId_fkey" FOREIGN KEY ("clientProprietaireId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MouvementCaisse" ADD CONSTRAINT "MouvementCaisse_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "ReceptionCaisses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MouvementCaisse" ADD CONSTRAINT "MouvementCaisse_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "Vente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MouvementCaisse" ADD CONSTRAINT "MouvementCaisse_pretCaisseId_fkey" FOREIGN KEY ("pretCaisseId") REFERENCES "PretCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MouvementCaisse" ADD CONSTRAINT "MouvementCaisse_peseeId_fkey" FOREIGN KEY ("peseeId") REFERENCES "Pesee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MouvementCaisse" ADD CONSTRAINT "MouvementCaisse_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VenteCaisse" ADD CONSTRAINT "VenteCaisse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VenteCaisse" ADD CONSTRAINT "VenteCaisse_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "Vente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VenteCaisse" ADD CONSTRAINT "VenteCaisse_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VenteCaisse" ADD CONSTRAINT "VenteCaisse_clientProprietaireId_fkey" FOREIGN KEY ("clientProprietaireId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PretCaisseSource" ADD CONSTRAINT "PretCaisseSource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PretCaisseSource" ADD CONSTRAINT "PretCaisseSource_pretCaisseId_fkey" FOREIGN KEY ("pretCaisseId") REFERENCES "PretCaisse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PretCaisseSource" ADD CONSTRAINT "PretCaisseSource_typeCaisseId_fkey" FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PretCaisseSource" ADD CONSTRAINT "PretCaisseSource_clientProprietaireId_fkey" FOREIGN KEY ("clientProprietaireId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill sûr : l'ancien stock était implicitement la propriété de la Wakala.
INSERT INTO "StockCaisseWakala" ("id", "tenantId", "typeCaisseId", "quantite", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, tc."tenantId", tc."id", tc."stockDisponible", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "TypeCaisse" tc
ON CONFLICT ("tenantId", "typeCaisseId") DO NOTHING;

-- Les prêts historiques n'enregistraient aucune autre provenance démontrable.
INSERT INTO "PretCaisseSource" (
    "id", "tenantId", "pretCaisseId", "typeCaisseId", "quantite",
    "quantiteRetournee", "proprietaire", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, p."tenantId", p."id", p."typeCaisseId",
       p."nombrePrete", p."nombreRetourne", 'WAKALA', p."createdAt", p."updatedAt"
FROM "PretCaisse" p
WHERE p."nombrePrete" > 0;
