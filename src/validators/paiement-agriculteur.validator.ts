import { z } from "zod";

/**
 * Schéma de validation pour l'enregistrement d'un paiement (avance/règlement)
 * sur un bon d'achat. Le plafond (reste à payer) est vérifié côté serveur,
 * pas ici — il dépend de l'état courant du bon d'achat.
 */
export const createPaiementAgriculteurSchema = z.object({
    bonAchatId: z.string().min(1, "Le bon d'achat est requis"),
    montant: z.coerce.number().positive("Le montant doit être positif"),
    modePaiement: z.string().optional(),
    observations: z.string().optional(),
});

export type CreatePaiementAgriculteurInput = z.infer<typeof createPaiementAgriculteurSchema>;
