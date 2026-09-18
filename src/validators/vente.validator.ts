import { z } from "zod";
import { caisseSourceLineSchema } from "@/validators/caisse-stock.validator";

/**
 * Schéma de validation pour la création d'une vente. Le stock disponible
 * (max de quantite) est vérifié côté serveur, pas ici — il dépend du lot
 * sélectionné.
 */
export const createVenteSchema = z.object({
    clientId: z.string().min(1, "Le client est requis"),
    stockId: z.string().min(1, "Le lot de stock est requis"),
    quantite: z.coerce.number().positive("La quantité doit être positive"),
    prixUnitaire: z.coerce.number().positive("Le prix unitaire doit être positif"),
    caisses: z.array(caisseSourceLineSchema).default([]),
}).superRefine((data, ctx) => {
    data.caisses.forEach((caisse, index) => {
        if (caisse.proprietaire === "CLIENT" && caisse.clientProprietaireId !== data.clientId) {
            ctx.addIssue({
                code: "custom",
                path: ["caisses", index, "clientProprietaireId"],
                message: "Les caisses client doivent appartenir au client de la vente",
            });
        }
    });
});

/**
 * Le lot de stock (stockId) n'est volontairement pas modifiable ici : changer
 * de lot demanderait de réconcilier deux stocks à la fois, hors du besoin
 * (corriger une erreur de saisie de quantité/prix), donc non supporté.
 */
export const updateVenteSchema = z.object({
    id: z.string().min(1, "ID requis"),
    clientId: z.string().min(1, "Le client est requis"),
    quantite: z.coerce.number().positive("La quantité doit être positive"),
    prixUnitaire: z.coerce.number().positive("Le prix unitaire doit être positif"),
});

export type CreateVenteInput = z.infer<typeof createVenteSchema>;
export type UpdateVenteInput = z.infer<typeof updateVenteSchema>;
