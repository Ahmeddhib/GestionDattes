import { userRepository } from "@/repositories/user.repository";
import { requirePermission } from "@/lib/permissions";
import { auditService } from "./audit.service";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const userService = {
    async getUsers(options?: { page?: number; pageSize?: number; search?: string; active?: boolean }) {
        await requirePermission("users:read");
        const result = await userRepository.findAll(options);

        // Transformer les données pour le format attendu par le composant
        const transformedData = result.data.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            active: user.active,
            createdAt: user.createdAt,
            // Prendre le premier rôle (premier tenant)
            role: user.TenantUser[0]?.Role ? {
                id: user.TenantUser[0].Role.name, // Utiliser name comme id temporairement
                name: user.TenantUser[0].Role.name,
            } : { id: 'unknown', name: 'Sans rôle' },
        }));

        return {
            data: transformedData,
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
        };
    },

    async getUserById(id: string) {
        await requirePermission("users:read");
        const user = await userRepository.findById(id);
        if (!user) {
            throw new Error("Utilisateur introuvable");
        }
        return user;
    },

    async createUser(data: { name: string; email: string; password: string; roleId: string }) {
        console.log("🔧 userService.createUser - Début");
        console.log("📋 Données:", { name: data.name, email: data.email, roleId: data.roleId });

        await requirePermission("users:create");
        console.log("✅ Permission accordée");

        // Vérifier si l'email existe déjà
        const existing = await userRepository.findByEmail(data.email);
        if (existing) {
            console.log("❌ Email déjà existant");
            throw new Error("Un utilisateur avec cet email existe déjà");
        }
        console.log("✅ Email disponible");

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(data.password, 10);
        console.log("✅ Mot de passe hashé");

        // Générer un ID unique
        const { createId } = await import("@paralleldrive/cuid2");
        const userId = createId();

        const user = await userRepository.create({
            id: userId,
            name: data.name,
            email: data.email,
            password: hashedPassword,
        });
        console.log("✅ Utilisateur créé en DB:", user.id);

        // Log audit
        const session = await auth();
        if (session?.user?.id && session?.user?.tenantId) {
            await auditService.log({
                tenantId: session.user.tenantId, // MULTI-TENANT: Audit par tenant
                actorId: session.user.id,
                action: "CREATE_USER",
                description: `Création de l'utilisateur "${data.name}" (${data.email})`,
                targetId: user.id,
            });
            console.log("✅ Audit log créé");
        }

        return user;
    },

    async updateUser(
        id: string,
        data: { name?: string; email?: string; password?: string; roleId?: string }
    ) {
        await requirePermission("users:update");

        // Vérifier si l'utilisateur existe
        const existing = await userRepository.findById(id);
        if (!existing) {
            throw new Error("Utilisateur introuvable");
        }

        // Si l'email change, vérifier qu'il n'existe pas déjà
        if (data.email && data.email !== existing.email) {
            const duplicate = await userRepository.findByEmail(data.email);
            if (duplicate) {
                throw new Error("Un utilisateur avec cet email existe déjà");
            }
        }

        // Hasher le mot de passe si fourni
        const updateData: any = { ...data };
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        const user = await userRepository.update(id, updateData);

        // Log audit
        const session = await auth();
        if (session?.user?.id && session?.user?.tenantId) {
            await auditService.log({
                tenantId: session.user.tenantId, // MULTI-TENANT: Audit par tenant
                actorId: session.user.id,
                action: "UPDATE_USER",
                description: `Modification de l'utilisateur "${user.name}"`,
                targetId: id,
            });
        }

        return user;
    },

    async activateUser(id: string) {
        await requirePermission("users:update");

        const user = await userRepository.update(id, { active: true });

        // Log audit
        const session = await auth();
        if (session?.user?.id && session?.user?.tenantId) {
            await auditService.log({
                tenantId: session.user.tenantId, // MULTI-TENANT: Audit par tenant
                actorId: session.user.id,
                action: "ACTIVATE_USER",
                description: `Activation de l'utilisateur "${user.name}"`,
                targetId: id,
            });
        }

        return user;
    },

    async deactivateUser(id: string) {
        await requirePermission("users:update");

        // Empêcher la désactivation de soi-même
        const session = await auth();
        if (session?.user?.id === id) {
            throw new Error("Vous ne pouvez pas désactiver votre propre compte");
        }

        const user = await userRepository.update(id, { active: false });

        // Log audit
        if (session?.user?.id && session?.user?.tenantId) {
            await auditService.log({
                tenantId: session.user.tenantId, // MULTI-TENANT: Audit par tenant
                actorId: session.user.id,
                action: "DEACTIVATE_USER",
                description: `Désactivation de l'utilisateur "${user.name}"`,
                targetId: id,
            });
        }

        return user;
    },

    async deleteUser(id: string) {
        await requirePermission("users:delete");

        // Empêcher la suppression de soi-même
        const session = await auth();
        if (session?.user?.id === id) {
            throw new Error("Vous ne pouvez pas supprimer votre propre compte");
        }

        const user = await userRepository.delete(id);

        // Log audit (après suppression)
        if (session?.user?.id && session?.user?.tenantId) {
            await auditService.log({
                tenantId: session.user.tenantId, // MULTI-TENANT: Audit par tenant
                actorId: session.user.id,
                action: "UPDATE_USER",
                description: `Suppression de l'utilisateur "${user.name}"`,
                targetId: id,
            });
        }

        return user;
    },

    /**
     * @deprecated Cette méthode est obsolète dans le système multi-tenant.
     * Utilisez TenantUser pour gérer les rôles par tenant.
     */
    async changeUserRole(userId: string, roleId: string) {
        throw new Error("Cette fonctionnalité n'est pas disponible dans le système multi-tenant. Utilisez la gestion des TenantUser.");

        /* OBSOLÈTE - CODE COMMENTÉ
        await requirePermission("users:update");

        const user = await userRepository.update(userId, { roleId });

        // Log audit
        const session = await auth();
        if (session?.user?.id && session?.user?.tenantId) {
            await auditService.log({
                tenantId: session.user.tenantId, // MULTI-TENANT: Audit par tenant
                actorId: session.user.id,
                action: "CHANGE_ROLE",
                description: `Changement de rôle pour "${user.name}" vers "${user.role.name}"`,
                targetId: userId,
            });
        }

        return user;
        */
    },

    async getUsersCount(options?: { active?: boolean }) {
        await requirePermission("users:read");
        return userRepository.count(options);
    },
};
