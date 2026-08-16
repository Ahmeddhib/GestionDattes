import { depenseAutreRepository } from "@/repositories/depense-autre.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import { assertSaisonOuverte, getSaisonOuverte } from "@/lib/saison-guard";
import type { CreateDepenseInput, UpdateDepenseInput } from "@/validators/depense-autre.validator";

export const depenseAutreService = {
    async getAll(tenantId: string, opts?: { saisonId?: string }) {
        await requirePermission("depense:read");
        return depenseAutreRepository.findAll(tenantId, opts);
    },

    async create(tenantId: string, userId: string, data: CreateDepenseInput) {
        await requirePermission("depense:create");

        const saison = await getSaisonOuverte(tenantId);
        const depense = await depenseAutreRepository.create(tenantId, userId, saison.id, data);

        await auditService.log({
            tenantId,
            actorId: userId,
            action: "CREATE_DEPENSE_AUTRE",
            targetId: depense.id,
            description: `Dépense créée: ${depense.libelle} (${depense.montant.toFixed(2)})`,
            details: { libelle: depense.libelle, montant: depense.montant },
        });

        return depense;
    },

    async update(tenantId: string, userId: string, data: UpdateDepenseInput) {
        await requirePermission("depense:update");

        const existing = await depenseAutreRepository.findById(tenantId, data.id);
        if (!existing) {
            throw new Error("Dépense introuvable dans cette Wakala");
        }
        await assertSaisonOuverte(tenantId, existing.saisonId);

        const depense = await depenseAutreRepository.update(tenantId, data);

        await auditService.log({
            tenantId,
            actorId: userId,
            action: "UPDATE_DEPENSE_AUTRE",
            targetId: depense.id,
            description: `Dépense mise à jour: ${depense.libelle}`,
            details: { libelle: depense.libelle, montant: depense.montant },
        });

        return depense;
    },

    async delete(tenantId: string, userId: string, id: string) {
        await requirePermission("depense:delete");

        const depense = await depenseAutreRepository.findById(tenantId, id);
        if (!depense) {
            throw new Error("Dépense introuvable dans cette Wakala");
        }

        await depenseAutreRepository.delete(tenantId, id);

        await auditService.log({
            tenantId,
            actorId: userId,
            action: "DELETE_DEPENSE_AUTRE",
            targetId: id,
            description: `Dépense supprimée: ${depense.libelle}`,
            details: { libelle: depense.libelle },
        });

        return { success: true };
    },
};
