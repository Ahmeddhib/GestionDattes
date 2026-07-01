import { z } from "zod";

/**
 * Validation pour la création d'un agriculteur
 */
export const createAgriculteurSchema = z.object({
    code: z.string().min(3, "Le code doit contenir au moins 3 caractères").max(20, "Le code ne peut pas dépasser 20 caractères"),
    cin: z.string().min(8, "Le CIN doit contenir 8 caractères").max(8, "Le CIN doit contenir 8 caractères"),
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    telephone: z.string().optional(),
    adresse: z.string().optional(),
    nbPalmiers: z.number().int().min(1, "Le nombre de palmiers doit être au moins 1"),
    superficie: z.number().positive("La superficie doit être positive").optional(),
    productionEstimee: z.number().positive("La production estimée doit être positive").optional(),
    regionId: z.string().min(1, "La région est requise"),
});

/**
 * Validation pour la mise à jour d'un agriculteur
 */
export const updateAgriculteurSchema = z.object({
    id: z.string().min(1, "L'ID est requis"),
    code: z.string().min(3, "Le code doit contenir au moins 3 caractères").max(20, "Le code ne peut pas dépasser 20 caractères").optional(),
    cin: z.string().min(8, "Le CIN doit contenir 8 caractères").max(8, "Le CIN doit contenir 8 caractères").optional(),
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
    prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères").optional(),
    telephone: z.string().optional().nullable(),
    adresse: z.string().optional().nullable(),
    nbPalmiers: z.number().int().min(1, "Le nombre de palmiers doit être au moins 1").optional(),
    superficie: z.number().positive("La superficie doit être positive").optional().nullable(),
    productionEstimee: z.number().positive("La production estimée doit être positive").optional().nullable(),
    regionId: z.string().min(1, "La région est requise").optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateAgriculteurInput = z.infer<typeof createAgriculteurSchema>;
export type UpdateAgriculteurInput = z.infer<typeof updateAgriculteurSchema>;
