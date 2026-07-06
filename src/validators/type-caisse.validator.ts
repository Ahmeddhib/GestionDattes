import { z } from "zod";

/**
 * Factory function pour créer les validateurs de type de caisse avec messages traduits
 */
export const createTypeCaisseValidators = (t: (key: string) => string) => {
    const createTypeCaisseSchema = z.object({
        nom: z.string().min(2, t("validation.minLength").replace("{min}", "2")),
        poidsKg: z.number().positive(t("validation.positive")),
        stockDisponible: z.number().int(t("validation.integer")).min(0, t("validation.minValue").replace("{min}", "0")).optional(),
    });

    const updateTypeCaisseSchema = z.object({
        id: z.string().min(1, t("validation.required")),
        nom: z.string().min(2, t("validation.minLength").replace("{min}", "2")).optional(),
        poidsKg: z.number().positive(t("validation.positive")).optional(),
        stockDisponible: z.number().int(t("validation.integer")).min(0, t("validation.minValue").replace("{min}", "0")).optional(),
    });

    return { createTypeCaisseSchema, updateTypeCaisseSchema };
};

/**
 * Schémas par défaut (français) pour compatibilité
 */
export const createTypeCaisseSchema = z.object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    poidsKg: z.number().positive("Le poids doit être positif"),
    stockDisponible: z.number().int("Le stock doit être un nombre entier").min(0, "Le stock ne peut pas être négatif").optional(),
});

export const updateTypeCaisseSchema = z.object({
    id: z.string().min(1, "L'ID est requis"),
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
    poidsKg: z.number().positive("Le poids doit être positif").optional(),
    stockDisponible: z.number().int("Le stock doit être un nombre entier").min(0, "Le stock ne peut pas être négatif").optional(),
});

export type CreateTypeCaisseInput = z.infer<typeof createTypeCaisseSchema>;
export type UpdateTypeCaisseInput = z.infer<typeof updateTypeCaisseSchema>;
