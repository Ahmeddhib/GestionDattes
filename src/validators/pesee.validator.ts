import { z } from "zod";

/**
 * Schéma de validation pour la création d'une pesée
 */
export const createPeseeSchema = z.object({
    livraisonId: z.string().min(1, { message: "La livraison est requise" }),
    poidsBrut: z.number().positive({ message: "Le poids brut doit être positif" }),
    tare: z.number().nonnegative({ message: "La tare doit être positive ou nulle" }).optional().nullable(),
}).refine(
    (data) => {
        // Si tare est fournie, poidsNet = poidsBrut - tare
        if (data.tare !== null && data.tare !== undefined) {
            const poidsNet = data.poidsBrut - data.tare;
            return poidsNet > 0;
        }
        return true;
    },
    {
        message: "Le poids net (poids brut - tare) doit être positif",
        path: ["poidsBrut"],
    }
);

/**
 * Schéma de validation pour la mise à jour d'une pesée
 */
export const updatePeseeSchema = z.object({
    id: z.string().min(1, { message: "ID requis" }),
    poidsBrut: z.number().positive({ message: "Le poids brut doit être positif" }),
    tare: z.number().nonnegative({ message: "La tare doit être positive ou nulle" }).optional().nullable(),
}).refine(
    (data) => {
        if (data.tare !== null && data.tare !== undefined) {
            const poidsNet = data.poidsBrut - data.tare;
            return poidsNet > 0;
        }
        return true;
    },
    {
        message: "Le poids net (poids brut - tare) doit être positif",
        path: ["poidsBrut"],
    }
);

export type CreatePeseeInput = z.infer<typeof createPeseeSchema>;
export type UpdatePeseeInput = z.infer<typeof updatePeseeSchema>;
