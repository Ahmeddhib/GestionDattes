import { z } from "zod";

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
