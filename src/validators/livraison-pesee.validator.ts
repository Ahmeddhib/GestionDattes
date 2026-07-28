import { z } from "zod";

const ligneSchema = z.object({
    typeDateId: z.string().min(1, "Le type de datte est requis"),
    typeCaisseId: z.string().min(1, "Le type de caisse est requis"),
    quantiteDeclaree: z.coerce
        .number()
        .int("La quantité doit être un nombre entier")
        .min(1, "La quantité doit être au moins 1"),
    prixKg: z.coerce.number().positive("Le prix au kg doit être positif pour chaque ligne"),
    quantiteAcceptee: z.coerce.number().positive("La quantité acceptée doit être positive").optional(),
    caisses: z
        .array(z.object({ poidsBrut: z.number().positive("Le poids brut doit être positif") }))
        .min(1, "Au moins une caisse doit être pesée par ligne"),
});

function uniqueLignesRefinement(data: { lignes: { typeCaisseId: string; typeDateId: string }[] }) {
    const keys = data.lignes.map((l) => `${l.typeCaisseId}::${l.typeDateId}`);
    return new Set(keys).size === keys.length;
}

const uniqueLignesIssue = {
    message: "Chaque combinaison de type de caisse et type de datte doit être unique",
    path: ["lignes"],
};

export const creerLivraisonAvecPeseesSchema = z
    .object({
        agriculteurId: z.string().min(1, "L'agriculteur est requis"),
        dateLivraison: z.string().min(1, "La date de livraison est requise"),
        lignes: z.array(ligneSchema).min(1, "Au moins une ligne de livraison est requise"),
        observations: z.string().optional(),
    })
    .refine(uniqueLignesRefinement, uniqueLignesIssue);

export type CreerLivraisonAvecPeseesInput = z.infer<typeof creerLivraisonAvecPeseesSchema>;

/**
 * Resynchronisation d'une livraison existante : mêmes lignes de pesée que la
 * création, mais tous les champs annexes (agriculteur, prix, observations)
 * sont optionnels — s'ils sont omis, les valeurs actuelles du bon d'achat
 * existant sont conservées.
 */
export const mettreAJourLivraisonAvecPeseesSchema = z
    .object({
        agriculteurId: z.string().min(1, "L'agriculteur est requis").optional(),
        dateLivraison: z.string().min(1, "La date de livraison est requise"),
        lignes: z.array(ligneSchema).min(1, "Au moins une ligne de livraison est requise"),
        observations: z.string().optional(),
    })
    .refine(uniqueLignesRefinement, uniqueLignesIssue);

export type MettreAJourLivraisonAvecPeseesInput = z.infer<typeof mettreAJourLivraisonAvecPeseesSchema>;
