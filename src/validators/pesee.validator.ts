import { z } from "zod";

/**
 * Schéma d'une caisse pesée individuellement.
 * `tareKg` est injecté dynamiquement (jamais fourni par le client) pour garantir
 * qu'une caisse ne peut pas peser moins que sa propre tare.
 */
export function buildPeseeCaisseSchema(tareKg: number) {
    return z.object({
        poidsBrut: z
            .number()
            .positive({ message: "Le poids brut doit être positif" })
            .refine((v) => v > tareKg, {
                message: `Le poids brut doit être supérieur à la tare (${tareKg} kg)`,
            }),
    });
}

export function buildCreatePeseeSchema(tareKg: number) {
    return z.object({
        livraisonId: z.string().min(1, { message: "La livraison est requise" }),
        typeCaisseId: z.string().min(1, { message: "Le type de caisse est requis" }),
        typeDateId: z.string().min(1, { message: "Le type de datte est requis" }),
        caisses: z
            .array(buildPeseeCaisseSchema(tareKg))
            .min(1, { message: "Au moins une caisse doit être pesée" }),
    });
}

export function buildUpdatePeseeSchema(tareKg: number) {
    return z.object({
        id: z.string().min(1, { message: "ID requis" }),
        caisses: z
            .array(buildPeseeCaisseSchema(tareKg))
            .min(1, { message: "Au moins une caisse doit être pesée" }),
    });
}

export type PeseeCaisseInput = z.infer<ReturnType<typeof buildPeseeCaisseSchema>>;
export type CreatePeseeInput = z.infer<ReturnType<typeof buildCreatePeseeSchema>>;
export type UpdatePeseeInput = z.infer<ReturnType<typeof buildUpdatePeseeSchema>>;
