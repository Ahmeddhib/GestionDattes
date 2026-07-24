-- Le champ "tare" de TypeCaisse était systématiquement laissé à 0 (jamais utilisé
-- pour le calcul du poids net). On utilise désormais "poidsKg" comme tare partout.
ALTER TABLE "TypeCaisse" DROP COLUMN "tare";
