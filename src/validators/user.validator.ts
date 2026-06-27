import { z } from "zod";

export const createUserValidator = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom ne peut pas dépasser 100 caractères"),
    email: z.string().email("Email invalide").toLowerCase(),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    roleId: z.string().cuid("ID de rôle invalide"),
});

export const updateUserValidator = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom ne peut pas dépasser 100 caractères").optional(),
    email: z.string().email("Email invalide").toLowerCase().optional(),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").optional(),
    roleId: z.string().cuid("ID de rôle invalide").optional(),
});

export const loginValidator = z.object({
    email: z.string().email("Email invalide").toLowerCase(),
    password: z.string().min(1, "Le mot de passe est requis"),
});

export type CreateUserInput = z.infer<typeof createUserValidator>;
export type UpdateUserInput = z.infer<typeof updateUserValidator>;
export type LoginInput = z.infer<typeof loginValidator>;
