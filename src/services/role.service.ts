import { roleRepository } from "@/repositories/role.repository";
import { requirePermission } from "@/lib/permissions";
import { auditService } from "./audit.service";
import { auth } from "@/lib/auth";

export const roleService = {
    async getRoles(options?: { page?: number; pageSize?: number; search?: string }) {
        await requirePermission("roles:read");
        return roleRepository.findAll(options);
    },

    async getRoleById(id: string) {
        await requirePermission("roles:read");
        const role = await roleRepository.findById(id);
        if (!role) {
            throw new Error("Rôle introuvable");
        }
        return role;
    },

    async createRole(data: { name: string; description?: string | null }) {
        await requirePermission("roles:create");

        // Vérifier si le nom existe déjà
        const existing = await roleRepository.findByName(data.name);
        if (existing) {
            throw new Error("Un rôle avec ce nom existe déjà");
        }

        const role = await roleRepository.create(data);

        // Log audit
        const session = await auth();
        if (session?.user?.id) {
            await auditService.log({
                actorId: session.user.id,
                action: "CREATE_ROLE",
                description: `Création du rôle "${data.name}"`,
                targetId: role.id,
            });
        }

        return role;
    },

    async updateRole(id: string, data: { name?: string; description?: string | null }) {
        await requirePermission("roles:update");

        // Vérifier si le rôle existe
        const existing = await roleRepository.findById(id);
        if (!existing) {
            throw new Error("Rôle introuvable");
        }

        // Si le nom change, vérifier qu'il n'existe pas déjà
        if (data.name && data.name !== existing.name) {
            const duplicate = await roleRepository.findByName(data.name);
            if (duplicate) {
                throw new Error("Un rôle avec ce nom existe déjà");
            }
        }

        const role = await roleRepository.update(id, data);

        // Log audit
        const session = await auth();
        if (session?.user?.id) {
            await auditService.log({
                actorId: session.user.id,
                action: "UPDATE_ROLE",
                description: `Modification du rôle "${role.name}"`,
                targetId: id,
            });
        }

        return role;
    },

    async deleteRole(id: string) {
        await requirePermission("roles:delete");

        // Vérifier si le rôle existe
        const existing = await roleRepository.findById(id);
        if (!existing) {
            throw new Error("Rôle introuvable");
        }

        // Vérifier qu'aucun utilisateur n'utilise ce rôle
        if (existing._count.users > 0) {
            throw new Error(`Impossible de supprimer ce rôle car ${existing._count.users} utilisateur(s) l'utilisent`);
        }

        const role = await roleRepository.delete(id);

        // Log audit
        const session = await auth();
        if (session?.user?.id) {
            await auditService.log({
                actorId: session.user.id,
                action: "DELETE_ROLE",
                description: `Suppression du rôle "${role.name}"`,
                targetId: id,
            });
        }

        return role;
    },

    async getRolesCount() {
        await requirePermission("roles:read");
        return roleRepository.count();
    },
};
