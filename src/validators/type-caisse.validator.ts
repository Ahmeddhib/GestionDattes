import { z } from "zod";

/**
 * Factory function pour créer les validateurs de type de caisse avec messages traduits
 */
export const createTypeCaisseValidators = (t: (key: string) => string) => {
    const createTypeCaisseSchema = z.object({
        nom: z.string().min(2, t("validation.minLength").replace("{min}", "2")),
        poidsKg: z.number().positive(t("validation.positive")),
    });

    const updateTypeCaisseSchema = z.object({
        id: z.string().min(1, t("validation.required")),
        nom: z.string().min(2, t("validation.minLength").replace("{min}", "2")).optional(),
        poidsKg: z.number().positive(t("validation.positive")).optional(),
    });

    return { createTypeCaisseSchema, updateTypeCaisseSchema };
};

/**
 * Schémas par défaut (français) pour compatibilité
 */
export const createTypeCaisseSchema = z.object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    poidsKg: z.number().positive("Le poids doit être positif"),
});

export const updateTypeCaisseSchema = z.object({
    id: z.string().min(1, "L'ID est requis"),
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
    poidsKg: z.number().positive("Le poids doit être positif").optional(),
});

export type CreateTypeCaisseInput = z.infer<typeof createTypeCaisseSchema>;
export type UpdateTypeCaisseInput = z.infer<typeof updateTypeCaisseSchema>;
