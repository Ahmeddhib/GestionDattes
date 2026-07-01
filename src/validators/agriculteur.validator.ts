import { z } from "zod";

/**
 * Factory function pour créer les validateurs d'agriculteur avec messages traduits
 */
export const createAgriculteurValidators = (t: (key: string) => string) => {
    const createAgriculteurSchema = z.object({
        code: z
            .string()
            .min(3, t("validation.minLength").replace("{min}", "3"))
            .max(20, t("validation.maxLength").replace("{max}", "20")),
        cin: z
            .string()
            .length(8, t("validation.cinExact")),
        nom: z.string().min(2, t("validation.minLength").replace("{min}", "2")),
        prenom: z.string().min(2, t("validation.minLength").replace("{min}", "2")),
        telephone: z.string().optional(),
        adresse: z.string().optional(),
        nbPalmiers: z.number().int(t("validation.integer")).min(1, t("validation.minValue").replace("{min}", "1")),
        superficie: z.number().positive(t("validation.positive")).optional(),
        productionEstimee: z.number().positive(t("validation.positive")).optional(),
        regionId: z.string().min(1, t("validation.required")),
    });

    const updateAgriculteurSchema = z.object({
        id: z.string().min(1, t("validation.required")),
        code: z
            .string()
            .min(3, t("validation.minLength").replace("{min}", "3"))
            .max(20, t("validation.maxLength").replace("{max}", "20"))
            .optional(),
        cin: z
            .string()
            .length(8, t("validation.cinExact"))
            .optional(),
        nom: z.string().min(2, t("validation.minLength").replace("{min}", "2")).optional(),
        prenom: z.string().min(2, t("validation.minLength").replace("{min}", "2")).optional(),
        telephone: z.string().optional().nullable(),
        adresse: z.string().optional().nullable(),
        nbPalmiers: z.number().int(t("validation.integer")).min(1, t("validation.minValue").replace("{min}", "1")).optional(),
        superficie: z.number().positive(t("validation.positive")).optional().nullable(),
        productionEstimee: z.number().positive(t("validation.positive")).optional().nullable(),
        regionId: z.string().min(1, t("validation.required")).optional(),
    });

    return { createAgriculteurSchema, updateAgriculteurSchema };
};

/**
 * Schémas par défaut (français) pour compatibilité
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

export type CreateAgriculteurInput = z.infer<typeof createAgriculteurSchema>;
export type UpdateAgriculteurInput = z.infer<typeof updateAgriculteurSchema>;

