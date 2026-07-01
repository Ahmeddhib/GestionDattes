import { z } from "zod";

/**
 * Factory function pour créer les validateurs de rôle avec messages traduits
 */
export const createRoleValidators = (t: (key: string) => string) => {
    const createRoleValidator = z.object({
        name: z
            .string()
            .min(2, t("validation.minLength").replace("{min}", "2"))
            .max(50, t("validation.maxLength").replace("{max}", "50"))
            .regex(/^[A-Z_]+$/, t("validation.roleFormat")),
        description: z.string().max(255, t("validation.maxLength").replace("{max}", "255")).optional().nullable(),
    });

    const updateRoleValidator = z.object({
        name: z
            .string()
            .min(2, t("validation.minLength").replace("{min}", "2"))
            .max(50, t("validation.maxLength").replace("{max}", "50"))
            .regex(/^[A-Z_]+$/, t("validation.roleFormat"))
            .optional(),
        description: z.string().max(255, t("validation.maxLength").replace("{max}", "255")).optional().nullable(),
    });

    const deleteRoleValidator = z.object({
        id: z.string().min(1, t("validation.required")),
    });

    return { createRoleValidator, updateRoleValidator, deleteRoleValidator };
};

/**
 * Schémas par défaut (français) pour compatibilité
 */
export const createRoleValidator = z.object({
    name: z
        .string()
        .min(2, "Le nom doit contenir au moins 2 caractères")
        .max(50, "Le nom ne peut pas dépasser 50 caractères")
        .regex(/^[A-Z_]+$/, "Le nom doit être en majuscules avec underscores uniquement (ex: SUPER_ADMIN)"),
    description: z.string().max(255, "La description ne peut pas dépasser 255 caractères").optional().nullable(),
});

export const updateRoleValidator = z.object({
    name: z
        .string()
        .min(2, "Le nom doit contenir au moins 2 caractères")
        .max(50, "Le nom ne peut pas dépasser 50 caractères")
        .regex(/^[A-Z_]+$/, "Le nom doit être en majuscules avec underscores uniquement (ex: SUPER_ADMIN)")
        .optional(),
    description: z.string().max(255, "La description ne peut pas dépasser 255 caractères").optional().nullable(),
});

export const deleteRoleValidator = z.object({
    id: z.string().min(1, "ID invalide"),
});

export type CreateRoleInput = z.infer<typeof createRoleValidator>;
export type UpdateRoleInput = z.infer<typeof updateRoleValidator>;
export type DeleteRoleInput = z.infer<typeof deleteRoleValidator>;

