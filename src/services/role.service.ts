import { roleRepository } from "@/repositories/role.repository";
import { requirePermission } from "@/lib/permissions";
import { auditService } from "./audit.service";
import { auth } from "@/lib/auth";

export const roleService = {
    async getRoles(options?: { page?: number; pageSize?: number; search?: string }) {
        await requirePermission("roles:read");
        const result = await roleRepository.findAll(options);

        // Transformer les données pour le format attendu par le composant
        const transformedData = result.data.map((role: any) => ({
            ...role,
            // Transformer _count.TenantUser → _count.users
            _count: {
                users: role._count?.TenantUser || 0,
            },
        }));

        return {
            data: transformedData,
            total: result.total,
        };
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
        if (session?.user?.id && session?.user?.tenantId) {
            await auditService.log({
                tenantId: session.user.tenantId, // MULTI-TENANT: Audit par tenant
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
        if (session?.user?.id && session?.user?.tenantId) {
            await auditService.log({
                tenantId: session.user.tenantId, // MULTI-TENANT: Audit par tenant
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
        // Note: Repository retourne _count.TenantUser, pas _count.users
        const userCount = (existing._count as any).TenantUser || 0;
        if (userCount > 0) {
            throw new Error(`Impossible de supprimer ce rôle car ${userCount} utilisateur(s) l'utilisent`);
        }

        const role = await roleRepository.delete(id);

        // Log audit
        const session = await auth();
        if (session?.user?.id && session?.user?.tenantId) {
            await auditService.log({
                tenantId: session.user.tenantId, // MULTI-TENANT: Audit par tenant
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
