import { z } from "zod";

const ligneSchema = z.object({
    typeDateId: z.string().min(1, "Le type de datte est requis"),
    typeCaisseId: z.string().min(1, "Le type de caisse est requis"),
    quantiteDeclaree: z.coerce
        .number()
        .int("La quantité doit être un nombre entier")
        .min(1, "La quantité doit être au moins 1"),
    caisses: z
        .array(z.object({ poidsBrut: z.number().positive("Le poids brut doit être positif") }))
        .min(1, "Au moins une caisse doit être pesée par ligne"),
});

export const creerLivraisonAvecPeseesSchema = z
    .object({
        agriculteurId: z.string().min(1, "L'agriculteur est requis"),
        dateLivraison: z.string().min(1, "La date de livraison est requise"),
        lignes: z.array(ligneSchema).min(1, "Au moins une ligne de livraison est requise"),
        prixKg: z.coerce.number().positive("Le prix au kg doit être positif"),
        quantiteAcceptee: z.coerce.number().positive("La quantité acceptée doit être positive").optional(),
        observations: z.string().optional(),
    })
    .refine(
        (data) => {
            const keys = data.lignes.map((l) => `${l.typeCaisseId}::${l.typeDateId}`);
            return new Set(keys).size === keys.length;
        },
        {
            message: "Chaque combinaison de type de caisse et type de datte doit être unique",
            path: ["lignes"],
        }
    );

export type CreerLivraisonAvecPeseesInput = z.infer<typeof creerLivraisonAvecPeseesSchema>;
