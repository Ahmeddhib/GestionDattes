import { z } from "zod";

/**
 * Schéma pour un type de caisse dans une livraison
 */
export const livraisonTypeCaisseSchema = z.object({
    typeCaisseId: z.string().min(1, "Le type de caisse est requis"),
    quantite: z.coerce
        .number()
        .int("La quantité doit être un nombre entier")
        .min(1, "La quantité doit être au moins 1"),
});

/**
 * Schéma de validation pour la création d'une livraison
 */
export const createLivraisonSchema = z.object({
    agriculteurId: z.string().min(1, "L'agriculteur est requis"),
    typeDateId: z.string().min(1, "Le type de datte est requis"),
    dateLivraison: z.string().min(1, "La date de livraison est requise"),
    caisses: z.array(livraisonTypeCaisseSchema).min(1, "Au moins un type de caisse est requis"),
});

/**
 * Schéma de validation pour la mise à jour d'une livraison
 */
export const updateLivraisonSchema = z.object({
    id: z.string().min(1, "L'ID est requis"),
    agriculteurId: z.string().min(1, "L'agriculteur est requis").optional(),
    typeDateId: z.string().min(1, "Le type de datte est requis").optional(),
    dateLivraison: z.string().min(1, "La date de livraison est requise").optional(),
    caisses: z.array(livraisonTypeCaisseSchema).min(1, "Au moins un type de caisse est requis").optional(),
});

export type LivraisonTypeCaisseInput = z.infer<typeof livraisonTypeCaisseSchema>;
export type CreateLivraisonInput = z.infer<typeof createLivraisonSchema>;
export type UpdateLivraisonInput = z.infer<typeof updateLivraisonSchema>;
