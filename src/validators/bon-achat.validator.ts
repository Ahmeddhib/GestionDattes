import { z } from "zod";

export const createBonAchatSchema = z.object({
    livraisonId: z.string().min(1, "La livraison est requise"),
    prixKg: z.coerce.number().positive("Le prix au kg doit être positif"),
    observations: z.string().optional(),
});

export type CreateBonAchatInput = z.infer<typeof createBonAchatSchema>;
