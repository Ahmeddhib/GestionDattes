-- =====================================================
-- MIGRATION: Single-Tenant → Multi-Tenant SaaS
-- Base de données partagée avec isolation par tenantId
-- =====================================================

BEGIN;

-- =====================================================
-- ÉTAPE 1: Créer la table Tenant (Wakala)
-- =====================================================

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Tenant_code_idx" ON "Tenant"("code");
CREATE INDEX "Tenant_active_idx" ON "Tenant"("active");

-- Créer tenant par défaut pour les données existantes
INSERT INTO "Tenant" ("id", "name", "code", "active", "createdAt", "updatedAt")
VALUES ('default-tenant-id', 'Wakala Principale', 'MAIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- ÉTAPE 2: Créer la table TenantUser (User ↔ Tenant)
-- =====================================================

CREATE TABLE "TenantUser" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "TenantUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TenantUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TenantUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TenantUser_userId_tenantId_key" ON "TenantUser"("userId", "tenantId");
CREATE INDEX "TenantUser_userId_idx" ON "TenantUser"("userId");
CREATE INDEX "TenantUser_tenantId_idx" ON "TenantUser"("tenantId");
CREATE INDEX "TenantUser_roleId_idx" ON "TenantUser"("roleId");

-- Migrer tous les utilisateurs existants vers le tenant par défaut
INSERT INTO "TenantUser" ("id", "userId", "tenantId", "roleId", "active", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "id" as "userId",
    'default-tenant-id' as "tenantId",
    "roleId",
    "active",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User";

-- =====================================================
-- ÉTAPE 3: Ajouter tenantId aux tables métier
-- =====================================================

-- 3.1 Region
ALTER TABLE "Region" ADD COLUMN "tenantId" TEXT;
UPDATE "Region" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "Region" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Region" ADD CONSTRAINT "Region_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Region_tenantId_idx" ON "Region"("tenantId");
DROP INDEX IF EXISTS "Region_code_key";
CREATE UNIQUE INDEX "Region_tenantId_code_key" ON "Region"("tenantId", "code");

-- 3.2 TypeDate
ALTER TABLE "TypeDate" ADD COLUMN "tenantId" TEXT;
UPDATE "TypeDate" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "TypeDate" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "TypeDate" ADD CONSTRAINT "TypeDate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "TypeDate_tenantId_idx" ON "TypeDate"("tenantId");
DROP INDEX IF EXISTS "TypeDate_nom_key";
CREATE UNIQUE INDEX "TypeDate_tenantId_nom_key" ON "TypeDate"("tenantId", "nom");

-- 3.3 TypeCaisse
ALTER TABLE "TypeCaisse" ADD COLUMN "tenantId" TEXT;
UPDATE "TypeCaisse" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "TypeCaisse" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "TypeCaisse" ADD CONSTRAINT "TypeCaisse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "TypeCaisse_tenantId_idx" ON "TypeCaisse"("tenantId");
DROP INDEX IF EXISTS "TypeCaisse_nom_key";
CREATE UNIQUE INDEX "TypeCaisse_tenantId_nom_key" ON "TypeCaisse"("tenantId", "nom");

-- 3.4 Agriculteur
ALTER TABLE "Agriculteur" ADD COLUMN "tenantId" TEXT;
UPDATE "Agriculteur" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "Agriculteur" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Agriculteur" ADD CONSTRAINT "Agriculteur_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Agriculteur_tenantId_idx" ON "Agriculteur"("tenantId");
DROP INDEX IF EXISTS "Agriculteur_code_key";
DROP INDEX IF EXISTS "Agriculteur_cin_key";
CREATE UNIQUE INDEX "Agriculteur_tenantId_code_key" ON "Agriculteur"("tenantId", "code");
CREATE UNIQUE INDEX "Agriculteur_tenantId_cin_key" ON "Agriculteur"("tenantId", "cin");

-- 3.5 PretCaisse
ALTER TABLE "PretCaisse" ADD COLUMN "tenantId" TEXT;
UPDATE "PretCaisse" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "PretCaisse" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PretCaisse" ADD CONSTRAINT "PretCaisse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "PretCaisse_tenantId_idx" ON "PretCaisse"("tenantId");

-- 3.6 Livraison
ALTER TABLE "Livraison" ADD COLUMN "tenantId" TEXT;
UPDATE "Livraison" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "Livraison" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Livraison" ADD CONSTRAINT "Livraison_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Livraison_tenantId_idx" ON "Livraison"("tenantId");
DROP INDEX IF EXISTS "Livraison_numeroLot_key";
CREATE UNIQUE INDEX "Livraison_tenantId_numeroLot_key" ON "Livraison"("tenantId", "numeroLot");

-- 3.7 BonAchat
ALTER TABLE "BonAchat" ADD COLUMN "tenantId" TEXT;
UPDATE "BonAchat" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "BonAchat" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "BonAchat" ADD CONSTRAINT "BonAchat_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "BonAchat_tenantId_idx" ON "BonAchat"("tenantId");
DROP INDEX IF EXISTS "BonAchat_numero_key";
CREATE UNIQUE INDEX "BonAchat_tenantId_numero_key" ON "BonAchat"("tenantId", "numero");

-- 3.8 Pesee
ALTER TABLE "Pesee" ADD COLUMN "tenantId" TEXT;
UPDATE "Pesee" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "Pesee" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Pesee" ADD CONSTRAINT "Pesee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Pesee_tenantId_idx" ON "Pesee"("tenantId");

-- 3.9 Echantillon
ALTER TABLE "Echantillon" ADD COLUMN "tenantId" TEXT;
UPDATE "Echantillon" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "Echantillon" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Echantillon" ADD CONSTRAINT "Echantillon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Echantillon_tenantId_idx" ON "Echantillon"("tenantId");
DROP INDEX IF EXISTS "Echantillon_code_key";
CREATE UNIQUE INDEX "Echantillon_tenantId_code_key" ON "Echantillon"("tenantId", "code");

-- 3.10 Analyse
ALTER TABLE "Analyse" ADD COLUMN "tenantId" TEXT;
UPDATE "Analyse" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "Analyse" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Analyse" ADD CONSTRAINT "Analyse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Analyse_tenantId_idx" ON "Analyse"("tenantId");

-- 3.11 StockDate
ALTER TABLE "StockDate" ADD COLUMN "tenantId" TEXT;
UPDATE "StockDate" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "StockDate" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "StockDate" ADD CONSTRAINT "StockDate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "StockDate_tenantId_idx" ON "StockDate"("tenantId");

-- 3.12 Conditionnement
ALTER TABLE "Conditionnement" ADD COLUMN "tenantId" TEXT;
UPDATE "Conditionnement" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "Conditionnement" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Conditionnement" ADD CONSTRAINT "Conditionnement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Conditionnement_tenantId_idx" ON "Conditionnement"("tenantId");

-- 3.13 Client
ALTER TABLE "Client" ADD COLUMN "tenantId" TEXT;
UPDATE "Client" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "Client" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Client_tenantId_idx" ON "Client"("tenantId");

-- 3.14 Vente
ALTER TABLE "Vente" ADD COLUMN "tenantId" TEXT;
UPDATE "Vente" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "Vente" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Vente_tenantId_idx" ON "Vente"("tenantId");

-- 3.15 BonSortie
ALTER TABLE "BonSortie" ADD COLUMN "tenantId" TEXT;
UPDATE "BonSortie" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "BonSortie" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "BonSortie" ADD CONSTRAINT "BonSortie_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "BonSortie_tenantId_idx" ON "BonSortie"("tenantId");
DROP INDEX IF EXISTS "BonSortie_numero_key";
CREATE UNIQUE INDEX "BonSortie_tenantId_numero_key" ON "BonSortie"("tenantId", "numero");

-- 3.16 AuditLog
ALTER TABLE "AuditLog" ADD COLUMN "tenantId" TEXT;
UPDATE "AuditLog" SET "tenantId" = 'default-tenant-id';
ALTER TABLE "AuditLog" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- =====================================================
-- ÉTAPE 4: Nettoyer l'ancien modèle User
-- =====================================================

-- Supprimer la relation directe User -> Role (maintenant dans TenantUser)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_roleId_fkey";
ALTER TABLE "User" DROP COLUMN IF EXISTS "roleId";

-- Supprimer la relation User -> Region (non applicable en multi-tenant)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_regionId_fkey";
ALTER TABLE "User" DROP COLUMN IF EXISTS "regionId";

-- =====================================================
-- ÉTAPE 5: Ajouter actions Tenant dans AuditAction enum
-- =====================================================

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CREATE_TENANT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'UPDATE_TENANT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACTIVATE_TENANT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DEACTIVATE_TENANT';

-- =====================================================
-- ÉTAPE 6: Vérifications d'intégrité
-- =====================================================

-- Vérifier que toutes les données ont un tenantId
DO $$
DECLARE
    missing_tenant_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_tenant_count FROM "Region" WHERE "tenantId" IS NULL;
    IF missing_tenant_count > 0 THEN
        RAISE EXCEPTION 'Region: % rows without tenantId', missing_tenant_count;
    END IF;
    
    SELECT COUNT(*) INTO missing_tenant_count FROM "Agriculteur" WHERE "tenantId" IS NULL;
    IF missing_tenant_count > 0 THEN
        RAISE EXCEPTION 'Agriculteur: % rows without tenantId', missing_tenant_count;
    END IF;
    
    SELECT COUNT(*) INTO missing_tenant_count FROM "Livraison" WHERE "tenantId" IS NULL;
    IF missing_tenant_count > 0 THEN
        RAISE EXCEPTION 'Livraison: % rows without tenantId', missing_tenant_count;
    END IF;
END $$;

COMMIT;

-- =====================================================
-- MIGRATION TERMINÉE
-- =====================================================

-- Afficher un résumé
SELECT 
    'Migration terminée' as status,
    (SELECT COUNT(*) FROM "Tenant") as tenants_count,
    (SELECT COUNT(*) FROM "TenantUser") as tenant_users_count,
    (SELECT COUNT(*) FROM "User") as users_count,
    (SELECT COUNT(*) FROM "Region") as regions_count,
    (SELECT COUNT(*) FROM "Agriculteur") as agriculteurs_count;
