-- Migration: Ajouter la gestion du stock de caisses
-- Date: 05/07/2026
-- Description: Ajoute le champ stockDisponible à TypeCaisse pour gérer les stocks

-- Ajouter la colonne stockDisponible avec valeur par défaut 0
ALTER TABLE "TypeCaisse" ADD COLUMN IF NOT EXISTS "stockDisponible" INTEGER NOT NULL DEFAULT 0;

-- Créer un index pour améliorer les performances des requêtes sur le stock
CREATE INDEX IF NOT EXISTS "TypeCaisse_stockDisponible_idx" ON "TypeCaisse"("stockDisponible");

-- Commentaires pour documentation
COMMENT ON COLUMN "TypeCaisse"."stockDisponible" IS 'Nombre de caisses disponibles en stock pour ce type';
