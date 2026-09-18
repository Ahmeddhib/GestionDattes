import { z } from "zod";

export const sourceCaisseSchema = z.discriminatedUnion("proprietaire", [
    z.object({
        proprietaire: z.literal("WAKALA"),
        clientProprietaireId: z.undefined().optional(),
        quantite: z.coerce.number().int().positive(),
    }),
    z.object({
        proprietaire: z.literal("CLIENT"),
        clientProprietaireId: z.string().min(1),
        quantite: z.coerce.number().int().positive(),
    }),
]);

export const createReceptionCaissesSchema = z.object({
    clientId: z.string().min(1, "Le client est requis"),
    date: z.coerce.date(),
    matriculeCamion: z.string().trim().max(80).optional(),
    chauffeur: z.string().trim().max(120).optional(),
    observations: z.string().trim().max(1000).optional(),
    lignes: z.array(z.object({
        typeCaisseId: z.string().min(1),
        quantite: z.coerce.number().int().positive(),
    })).min(1, "Ajoutez au moins une ligne"),
}).superRefine((data, ctx) => {
    const ids = new Set<string>();
    data.lignes.forEach((ligne, index) => {
        if (ids.has(ligne.typeCaisseId)) {
            ctx.addIssue({
                code: "custom",
                path: ["lignes", index, "typeCaisseId"],
                message: "Un type de caisse ne peut apparaître qu'une fois",
            });
        }
        ids.add(ligne.typeCaisseId);
    });
});

export const cancelReceptionCaissesSchema = z.object({
    receptionId: z.string().min(1),
    motif: z.string().trim().min(3).max(500),
});

export const adjustWakalaStockSchema = z.object({
    typeCaisseId: z.string().min(1, "Le type de caisse est requis"),
    nouvelleQuantite: z.coerce.number().int("La quantité doit être un entier").min(0, "La quantité ne peut pas être négative"),
    motif: z.string().trim().min(3, "Le motif doit contenir au moins 3 caractères").max(500),
});

export const caisseSourceLineSchema = sourceCaisseSchema.and(z.object({
    typeCaisseId: z.string().min(1),
}));

export type SourceCaisseInput = z.infer<typeof sourceCaisseSchema>;
export type CreateReceptionCaissesInput = z.infer<typeof createReceptionCaissesSchema>;
export type CancelReceptionCaissesInput = z.infer<typeof cancelReceptionCaissesSchema>;
export type AdjustWakalaStockInput = z.infer<typeof adjustWakalaStockSchema>;
