import { z } from "zod";

/**
 * Schéma de validation pour la création d'une saison
 */
export const createSaisonSchema = z
    .object({
        nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
        dateDebut: z.coerce.date(),
        dateFin: z.coerce.date(),
        statut: z.enum(["OUVERTE", "CLOTUREE"]).optional().default("OUVERTE"),
    })
    .refine((data) => data.dateFin > data.dateDebut, {
        message: "La date de fin doit être après la date de début",
        path: ["dateFin"],
    });

/**
 * Schéma de validation pour la mise à jour d'une saison — le statut n'est
 * jamais modifiable ici : seule la transaction de clôture peut passer une
 * saison à CLOTUREE (elle produit alors le BilanSaison figé).
 */
export const updateSaisonSchema = z
    .object({
        id: z.string().min(1, "ID requis"),
        nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
        dateDebut: z.coerce.date(),
        dateFin: z.coerce.date(),
    })
    .refine((data) => data.dateFin > data.dateDebut, {
        message: "La date de fin doit être après la date de début",
        path: ["dateFin"],
    });

export type CreateSaisonInput = z.infer<typeof createSaisonSchema>;
export type UpdateSaisonInput = z.infer<typeof updateSaisonSchema>;
