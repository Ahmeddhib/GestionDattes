import { z } from "zod";

/**
 * Schéma de validation pour la création d'un type de datte
 */
export const createTypeDateSchema = z.object({
    nom: z.string().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères"),
    description: z.string().max(500, "La description ne peut pas dépasser 500 caractères").optional(),
});

/**
 * Schéma de validation pour la mise à jour d'un type de datte
 */
export const updateTypeDateSchema = z.object({
    id: z.string().min(1, "L'ID est requis"),
    nom: z.string().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères").optional(),
    description: z.string().max(500, "La description ne peut pas dépasser 500 caractères").optional().nullable(),
});

export type CreateTypeDateInput = z.infer<typeof createTypeDateSchema>;
export type UpdateTypeDateInput = z.infer<typeof updateTypeDateSchema>;
