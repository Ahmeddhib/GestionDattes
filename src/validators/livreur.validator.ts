import { z } from "zod";

const livreurFields = {
    nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères"),
    telephone: z.string().trim().max(30).optional().nullable(),
    cin: z.string().trim().max(20).optional().nullable(),
    vehicule: z.string().trim().max(100).optional().nullable(),
    active: z.boolean().default(true),
};

export const createLivreurSchema = z.object(livreurFields);
export const updateLivreurSchema = z.object({
    id: z.string().min(1, "ID requis"),
    ...livreurFields,
});

export type CreateLivreurInput = z.infer<typeof createLivreurSchema>;
export type UpdateLivreurInput = z.infer<typeof updateLivreurSchema>;
