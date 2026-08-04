import { z } from "zod";

export const createDepenseSchema = z.object({
    libelle: z.string().min(2, "Le libellé doit contenir au moins 2 caractères"),
    montant: z.coerce.number().positive("Le montant doit être positif"),
    categorie: z.string().optional().nullable(),
    dateDepense: z.coerce.date().optional(),
    observations: z.string().optional().nullable(),
});

export const updateDepenseSchema = z.object({
    id: z.string().min(1, "ID requis"),
    libelle: z.string().min(2, "Le libellé doit contenir au moins 2 caractères"),
    montant: z.coerce.number().positive("Le montant doit être positif"),
    categorie: z.string().optional().nullable(),
    dateDepense: z.coerce.date().optional(),
    observations: z.string().optional().nullable(),
});

export type CreateDepenseInput = z.infer<typeof createDepenseSchema>;
export type UpdateDepenseInput = z.infer<typeof updateDepenseSchema>;
