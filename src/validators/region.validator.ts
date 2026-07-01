import { z } from "zod";

/**
 * Validation pour la création d'une région
 */
export const createRegionSchema = z.object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    code: z.string().min(2, "Le code doit contenir au moins 2 caractères").max(10, "Le code ne peut pas dépasser 10 caractères").optional(),
});

/**
 * Validation pour la mise à jour d'une région
 */
export const updateRegionSchema = z.object({
    id: z.string().min(1, "L'ID est requis"),
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
    code: z.string().min(2, "Le code doit contenir au moins 2 caractères").max(10, "Le code ne peut pas dépasser 10 caractères").optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateRegionInput = z.infer<typeof createRegionSchema>;
export type UpdateRegionInput = z.infer<typeof updateRegionSchema>;
