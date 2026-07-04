import { z } from "zod";

/**
 * Schéma de validation pour la création d'une livraison
 */
export const createLivraisonSchema = z.object({
    agriculteurId: z.string().min(1, "L'agriculteur est requis"),
    typeDateId: z.string().min(1, "Le type de datte est requis"),
    typeCaisseId: z.string().min(1, "Le type de caisse est requis"),
    dateLivraison: z.string().min(1, "La date de livraison est requise"),
    quantiteKg: z.coerce
        .number()
        .min(0.01, "La quantité doit être supérieure à 0")
        .finite("La quantité doit être un nombre valide"),
});

/**
 * Schéma de validation pour la mise à jour d'une livraison
 */
export const updateLivraisonSchema = z.object({
    id: z.string().min(1, "L'ID est requis"),
    agriculteurId: z.string().min(1, "L'agriculteur est requis").optional(),
    typeDateId: z.string().min(1, "Le type de datte est requis").optional(),
    typeCaisseId: z.string().min(1, "Le type de caisse est requis").optional(),
    dateLivraison: z.string().min(1, "La date de livraison est requise").optional(),
    quantiteKg: z.coerce
        .number()
        .min(0.01, "La quantité doit être supérieure à 0")
        .finite("La quantité doit être un nombre valide")
        .optional(),
});

export type CreateLivraisonInput = z.infer<typeof createLivraisonSchema>;
export type UpdateLivraisonInput = z.infer<typeof updateLivraisonSchema>;
