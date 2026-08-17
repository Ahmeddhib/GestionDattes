-- Trace du retour automatique de caisses déclenché par une pesée.
--
-- Sans elle, la suppression d'une livraison ne pouvait pas défaire le retour
-- exactement : elle retombait sur `nombreCaisses`, ce qui retirait du stock des
-- caisses qui n'y avaient jamais été remises lorsqu'aucun prêt n'était ouvert.
--
-- Rétro-remplissage à 0 délibéré : pour les pesées existantes, le nombre
-- réellement retourné est inconnu. Zéro fait que leur suppression ne touchera
-- pas au stock de caisses — sous-corriger est préférable à corrompre.
ALTER TABLE "Pesee" ADD COLUMN "caissesRetournees" INTEGER NOT NULL DEFAULT 0;
