import { z } from "zod";

/**
 * Factory function pour créer les validateurs de région avec messages traduits
 */
export const createRegionValidators = (t: (key: string) => string) => {
    const createRegionSchema = z.object({
        nom: z.string().min(2, t("validation.minLength").replace("{min}", "2")),
        code: z
            .string()
            .min(2, t("validation.minLength").replace("{min}", "2"))
            .max(10, t("validation.maxLength").replace("{max}", "10"))
            .optional(),
    });

    const updateRegionSchema = z.object({
        id: z.string().min(1, t("validation.required")),
        nom: z.string().min(2, t("validation.minLength").replace("{min}", "2")).optional(),
        code: z
            .string()
            .min(2, t("validation.minLength").replace("{min}", "2"))
            .max(10, t("validation.maxLength").replace("{max}", "10"))
            .optional(),
    });

    return { createRegionSchema, updateRegionSchema };
};

/**
 * Schémas par défaut (français) pour compatibilité
 */
export const createRegionSchema = z.object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    code: z
        .string()
        .min(2, "Le code doit contenir au moins 2 caractères")
        .max(10, "Le code ne peut pas dépasser 10 caractères")
        .optional(),
});

export const updateRegionSchema = z.object({
    id: z.string().min(1, "L'ID est requis"),
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
    code: z
        .string()
        .min(2, "Le code doit contenir au moins 2 caractères")
        .max(10, "Le code ne peut pas dépasser 10 caractères")
        .optional(),
});

export type CreateRegionInput = z.infer<typeof createRegionSchema>;
export type UpdateRegionInput = z.infer<typeof updateRegionSchema>;

