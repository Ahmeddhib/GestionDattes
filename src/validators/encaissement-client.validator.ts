import { z } from "zod";

/**
 * Schéma de validation pour l'enregistrement d'un encaissement sur une
 * vente. Le plafond (reste à payer) est vérifié côté serveur.
 */
export const createEncaissementClientSchema = z.object({
    venteId: z.string().min(1, "La vente est requise"),
    montant: z.coerce.number().positive("Le montant doit être positif"),
    modePaiement: z.string().optional(),
    observations: z.string().optional(),
});

export type CreateEncaissementClientInput = z.infer<typeof createEncaissementClientSchema>;
