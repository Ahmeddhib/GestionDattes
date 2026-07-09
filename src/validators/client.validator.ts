import { z } from "zod";

/**
 * Schéma de validation pour la création d'un client
 */
export const createClientSchema = z.object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    telephone: z.string().optional().nullable(),
    adresse: z.string().optional().nullable(),
    email: z.string().email("Email invalide").optional().nullable(),
});

/**
 * Schéma de validation pour la mise à jour d'un client
 */
export const updateClientSchema = z.object({
    id: z.string().min(1, "ID requis"),
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    telephone: z.string().optional().nullable(),
    adresse: z.string().optional().nullable(),
    email: z.string().email("Email invalide").optional().nullable(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
