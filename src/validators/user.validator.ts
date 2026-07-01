import { z } from "zod";

/**
 * Factory function pour créer les validateurs d'utilisateur avec messages traduits
 */
export const createUserValidators = (t: (key: string) => string) => {
    const createUserValidator = z.object({
        name: z
            .string()
            .min(2, t("validation.minLength").replace("{min}", "2"))
            .max(100, t("validation.maxLength").replace("{max}", "100")),
        email: z.string().email(t("validation.invalidEmail")).toLowerCase(),
        password: z.string().min(8, t("validation.passwordMin")),
        roleId: z.string().min(1, t("validation.required")),
    });

    const updateUserValidator = z.object({
        name: z
            .string()
            .min(2, t("validation.minLength").replace("{min}", "2"))
            .max(100, t("validation.maxLength").replace("{max}", "100"))
            .optional(),
        email: z.string().email(t("validation.invalidEmail")).toLowerCase().optional(),
        password: z.string().min(8, t("validation.passwordMin")).optional(),
        roleId: z.string().min(1, t("validation.required")).optional(),
    });

    const loginValidator = z.object({
        email: z.string().email(t("validation.invalidEmail")).toLowerCase(),
        password: z.string().min(1, t("validation.required")),
    });

    return { createUserValidator, updateUserValidator, loginValidator };
};

/**
 * Schémas par défaut (français) pour compatibilité
 */
export const createUserValidator = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom ne peut pas dépasser 100 caractères"),
    email: z.string().email("Email invalide").toLowerCase(),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    roleId: z.string().min(1, "Le rôle est requis"),
});

export const updateUserValidator = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom ne peut pas dépasser 100 caractères").optional(),
    email: z.string().email("Email invalide").toLowerCase().optional(),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").optional(),
    roleId: z.string().min(1, "Le rôle est requis").optional(),
});

export const loginValidator = z.object({
    email: z.string().email("Email invalide").toLowerCase(),
    password: z.string().min(1, "Le mot de passe est requis"),
});

export type CreateUserInput = z.infer<typeof createUserValidator>;
export type UpdateUserInput = z.infer<typeof updateUserValidator>;
export type LoginInput = z.infer<typeof loginValidator>;

