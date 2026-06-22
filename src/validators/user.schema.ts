import { z } from "zod";

export const CreateUserSchema = z.object({
    name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    role: z.enum(["ADMIN", "AGENT", "LABORANTIN"]),
});

export const UpdateUserSchema = z.object({
    name: z.string().min(3, "Le nom doit contenir au moins 3 caractères").optional(),
    email: z.string().email("Email invalide").optional(),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").optional(),
    role: z.enum(["ADMIN", "AGENT", "LABORANTIN"]).optional(),
});

export const LoginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
