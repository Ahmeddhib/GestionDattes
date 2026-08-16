-- Seuil d'alerte de stock (kg) optionnel, par variété de dattes. Nullable :
-- aucune valeur par défaut inventée, l'alerte "stock faible" du dashboard ne
-- se déclenche que pour les variétés où ce seuil est explicitement renseigné.
ALTER TABLE "TypeDate" ADD COLUMN "seuilAlerte" DOUBLE PRECISION;
