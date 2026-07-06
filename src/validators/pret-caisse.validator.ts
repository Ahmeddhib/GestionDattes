import { z } from "zod";

/**
 * Schéma de validation pour la création d'un prêt de caisses
 */
export const createPretCaisseSchema = z.object({
    agriculteurId: z.string().min(1, "L'agriculteur est requis"),
    typeCaisseId: z.string().min(1, "Le type de caisse est requis"),
    nombrePrete: z.coerce
        .number()
        .int("Le nombre doit être un entier")
        .min(1, "Le nombre doit être au moins 1"),
    observations: z.string().optional(),
    livraisonId: z.string().optional(),
});

/**
 * Schéma de validation pour le retour de caisses
 */
export const retourCaissesSchema = z.object({
    pretId: z.string().min(1, "L'ID du prêt est requis"),
    nombreRetourne: z.coerce
        .number()
        .int("Le nombre doit être un entier")
        .min(1, "Le nombre doit être au moins 1"),
    observations: z.string().optional(),
});

export type CreatePretCaisseInput = z.infer<typeof createPretCaisseSchema>;
export type RetourCaissesInput = z.infer<typeof retourCaissesSchema>;
