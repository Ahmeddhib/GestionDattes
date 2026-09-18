import { z } from "zod";
import { sourceCaisseSchema } from "@/validators/caisse-stock.validator";

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
    livreurId: z.string().optional(),
    sources: z.array(sourceCaisseSchema).default([]),
}).superRefine((data, ctx) => {
    if (data.sources.length > 0 && data.sources.reduce((total, source) => total + source.quantite, 0) !== data.nombrePrete) {
        ctx.addIssue({
            code: "custom",
            path: ["sources"],
            message: "La somme des sources doit être égale au nombre de caisses prêtées",
        });
    }
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
