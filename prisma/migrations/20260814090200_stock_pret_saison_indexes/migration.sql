-- Attribution de saison au stock et aux caisses, + index composites
-- (tenantId, saisonId) que les requêtes filtrées par saison utilisent
-- désormais partout.
--
-- Jusqu'ici StockDate et PretCaisse n'avaient AUCUN rattachement à une saison :
-- leurs chiffres dans le bilan étaient des instantanés globaux du tenant.

-- ---------------------------------------------------------------------------
-- 1. StockDate.saisonOrigineId — saison d'ENTRÉE du lot
-- ---------------------------------------------------------------------------
-- Le nom `saisonOrigineId` (et non `saisonId`) est délibéré : un lot entré en
-- saison A garde son origine A même vendu pendant la saison B.
-- `livraisonId` étant obligatoire, la dérivation est exacte, sans heuristique.
ALTER TABLE "StockDate" ADD COLUMN "saisonOrigineId" TEXT;

UPDATE "StockDate" sd
   SET "saisonOrigineId" = l."saisonId"
  FROM "Livraison" l
 WHERE l."id" = sd."livraisonId";

ALTER TABLE "StockDate" ALTER COLUMN "saisonOrigineId" SET NOT NULL;
ALTER TABLE "StockDate" ADD CONSTRAINT "StockDate_saisonOrigineId_fkey"
    FOREIGN KEY ("saisonOrigineId") REFERENCES "Saison"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "StockDate_tenantId_saisonOrigineId_idx" ON "StockDate"("tenantId", "saisonOrigineId");
CREATE INDEX "StockDate_tenantId_saisonOrigineId_dateEntree_idx" ON "StockDate"("tenantId", "saisonOrigineId", "dateEntree");

-- ---------------------------------------------------------------------------
-- 2. PretCaisse.saisonId — saison où le prêt a été consenti
-- ---------------------------------------------------------------------------
-- `livraisonId` est optionnel : un prêt autonome n'a aucun chemin transitif
-- vers une saison. Rétro-remplissage en cascade, la date n'étant utilisée
-- qu'en dernier recours et UNIQUEMENT pour ces lignes historiques (toute
-- nouvelle ligne est estampillée par getSaisonOuverte au moment de l'écriture).
ALTER TABLE "PretCaisse" ADD COLUMN "saisonId" TEXT;

-- passe 1 : via la livraison liée (exact)
UPDATE "PretCaisse" pc
   SET "saisonId" = l."saisonId"
  FROM "Livraison" l
 WHERE l."id" = pc."livraisonId" AND pc."saisonId" IS NULL;

-- passe 2 : saison du tenant dont l'intervalle contient datePreT
UPDATE "PretCaisse" pc
   SET "saisonId" = s."id"
  FROM "Saison" s
 WHERE s."tenantId" = pc."tenantId"
   AND pc."saisonId" IS NULL
   AND pc."datePreT" BETWEEN s."dateDebut" AND s."dateFin";

-- passe 3 : filet de sécurité — la plus ancienne saison du tenant (celle créée
-- par saisons_socle pour l'historique antérieur au module).
UPDATE "PretCaisse" pc
   SET "saisonId" = (
       SELECT s."id" FROM "Saison" s
        WHERE s."tenantId" = pc."tenantId"
        ORDER BY s."dateDebut" ASC
        LIMIT 1
   )
 WHERE pc."saisonId" IS NULL;

ALTER TABLE "PretCaisse" ALTER COLUMN "saisonId" SET NOT NULL;
ALTER TABLE "PretCaisse" ADD CONSTRAINT "PretCaisse_saisonId_fkey"
    FOREIGN KEY ("saisonId") REFERENCES "Saison"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "PretCaisse_tenantId_saisonId_idx" ON "PretCaisse"("tenantId", "saisonId");
CREATE INDEX "PretCaisse_tenantId_saisonId_statut_idx" ON "PretCaisse"("tenantId", "saisonId", "statut");

-- ---------------------------------------------------------------------------
-- 3. Index composites (tenantId, saisonId[, date de tri])
-- ---------------------------------------------------------------------------
-- Les 6 modèles métier n'avaient que des index SÉPARÉS sur tenantId et sur
-- saisonId ; toutes les requêtes de listes filtrent désormais sur le couple.
CREATE INDEX "Livraison_tenantId_saisonId_idx" ON "Livraison"("tenantId", "saisonId");
CREATE INDEX "Livraison_tenantId_saisonId_dateLivraison_idx" ON "Livraison"("tenantId", "saisonId", "dateLivraison");

CREATE INDEX "BonAchat_tenantId_saisonId_idx" ON "BonAchat"("tenantId", "saisonId");
CREATE INDEX "BonAchat_tenantId_saisonId_statut_idx" ON "BonAchat"("tenantId", "saisonId", "statut");

CREATE INDEX "Vente_tenantId_saisonId_idx" ON "Vente"("tenantId", "saisonId");
CREATE INDEX "Vente_tenantId_saisonId_date_idx" ON "Vente"("tenantId", "saisonId", "date");

CREATE INDEX "PaiementAgriculteur_tenantId_saisonId_idx" ON "PaiementAgriculteur"("tenantId", "saisonId");
CREATE INDEX "PaiementAgriculteur_tenantId_saisonId_datePaiement_idx" ON "PaiementAgriculteur"("tenantId", "saisonId", "datePaiement");

CREATE INDEX "EncaissementClient_tenantId_saisonId_idx" ON "EncaissementClient"("tenantId", "saisonId");
CREATE INDEX "EncaissementClient_tenantId_saisonId_dateEncaissement_idx" ON "EncaissementClient"("tenantId", "saisonId", "dateEncaissement");

CREATE INDEX "DepenseAutre_tenantId_saisonId_idx" ON "DepenseAutre"("tenantId", "saisonId");
CREATE INDEX "DepenseAutre_tenantId_saisonId_dateDepense_idx" ON "DepenseAutre"("tenantId", "saisonId", "dateDepense");
