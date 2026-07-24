import { z } from "zod";

/**
 * Schéma pour un type de caisse dans une livraison
 */
export const livraisonTypeCaisseSchema = z.object({
    typeCaisseId: z.string().min(1, "Le type de caisse est requis"),
    typeDateId: z.string().min(1, "Le type de datte est requis"),
    quantite: z.coerce
        .number()
        .int("La quantité doit être un nombre entier")
        .min(1, "La quantité doit être au moins 1"),
});

function hasDuplicateCaissePairs(caisses: { typeCaisseId: string; typeDateId: string }[]) {
    const keys = caisses.map((c) => `${c.typeCaisseId}::${c.typeDateId}`);
    return new Set(keys).size !== keys.length;
}

/**
 * Schéma de validation pour la création d'une livraison
 */
export const createLivraisonSchema = z.object({
    agriculteurId: z.string().min(1, "L'agriculteur est requis"),
    dateLivraison: z.string().min(1, "La date de livraison est requise"),
    quantiteLivree: z.coerce.number().nonnegative("La quantité livrée ne peut pas être négative"),
    quantiteAcceptee: z.coerce.number().nonnegative("La quantité acceptée ne peut pas être négative"),
    caisses: z.array(livraisonTypeCaisseSchema).min(1, "Au moins un type de caisse est requis"),
}).refine((data) => data.quantiteAcceptee <= data.quantiteLivree, {
    message: "La quantité acceptée ne peut pas dépasser la quantité livrée",
    path: ["quantiteAcceptee"],
}).refine((data) => !hasDuplicateCaissePairs(data.caisses), {
    message: "Chaque combinaison de type de caisse et type de datte doit être unique",
    path: ["caisses"],
});

/**
 * Schéma de validation pour la mise à jour d'une livraison
 */
export const updateLivraisonSchema = z.object({
    id: z.string().min(1, "L'ID est requis"),
    agriculteurId: z.string().min(1, "L'agriculteur est requis").optional(),
    dateLivraison: z.string().min(1, "La date de livraison est requise").optional(),
    quantiteLivree: z.coerce.number().nonnegative("La quantité livrée ne peut pas être négative").optional(),
    quantiteAcceptee: z.coerce.number().nonnegative("La quantité acceptée ne peut pas être négative").optional(),
    caisses: z.array(livraisonTypeCaisseSchema).min(1, "Au moins un type de caisse est requis").optional(),
}).refine(
    (data) => data.quantiteLivree === undefined || data.quantiteAcceptee === undefined || data.quantiteAcceptee <= data.quantiteLivree,
    { message: "La quantité acceptée ne peut pas dépasser la quantité livrée", path: ["quantiteAcceptee"] }
).refine(
    (data) => !data.caisses || !hasDuplicateCaissePairs(data.caisses),
    { message: "Chaque combinaison de type de caisse et type de datte doit être unique", path: ["caisses"] }
);

export type LivraisonTypeCaisseInput = z.infer<typeof livraisonTypeCaisseSchema>;
export type CreateLivraisonInput = z.infer<typeof createLivraisonSchema>;
export type UpdateLivraisonInput = z.infer<typeof updateLivraisonSchema>;
