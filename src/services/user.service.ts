import { userRepository } from "@/repositories/user.repository";
import { requirePermission } from "@/lib/permissions";
import { auditService } from "./audit.service";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

export const userService = {
    async getUsers(options?: { page?: number; pageSize?: number; search?: string; active?: boolean }) {
        await requirePermission("users:read");
        const session = await auth();
        if (!session?.user?.tenantId) {
            throw new Error("Aucune Wakala sélectionnée");
        }
        const result = await userRepository.findAll(options, session.user.tenantId);

        // Transformer les données pour le format attendu par le composant
        const transformedData = result.data.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            active: user.active,
            createdAt: user.createdAt,
            // Prendre le premier rôle (premier tenant)
            role: user.TenantUser[0]?.Role ? {
                id: user.TenantUser[0].Role.id,
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
        await requirePermission("users:create");
        const session = await auth();
        if (!session?.user?.id || !session.user.tenantId) {
            throw new Error("Aucune Wakala sélectionnée");
        }

        const email = data.email.trim().toLowerCase();
        const existing = await userRepository.findByEmail(email);
        const existingMembership = existing?.TenantUser.some(
            (membership) => membership.tenantId === session.user.tenantId
        );
        if (existingMembership) {
            throw new Error("Cet utilisateur appartient déjà à cette Wakala");
        }

        // Le rôle vient exclusivement du serveur. Une valeur roleId forgée par
        // le client ne peut donc jamais promouvoir un nouvel utilisateur.
        const userRole = await prisma.role.upsert({
            where: { name: "USER" },
            update: {},
            create: {
                id: createId(),
                name: "USER",
                description: "Utilisateur simple avec accès en lecture",
                updatedAt: new Date(),
            },
        });

        const hashedPassword = await bcrypt.hash(data.password, 12);
        const user = await prisma.$transaction(async (tx) => {
            const targetUser = existing
                ? await tx.user.findUniqueOrThrow({ where: { id: existing.id } })
                : await tx.user.create({
                    data: {
                        id: createId(),
                        name: data.name.trim(),
                        email,
                        password: hashedPassword,
                        active: true,
                    },
                });

            await tx.tenantUser.create({
                data: {
                    userId: targetUser.id,
                    tenantId: session.user.tenantId!,
                    roleId: userRole.id,
                    active: true,
                },
            });

            return targetUser;
        });

        await auditService.log({
            tenantId: session.user.tenantId,
            actorId: session.user.id,
            action: "CREATE_USER",
            description: `Ajout de l'utilisateur "${data.name}" (${email}) avec le rôle USER`,
            targetId: user.id,
        });

        return user;
    },

    async updateUser(
        id: string,
        data: { name?: string; email?: string; password?: string; roleId?: string }
    ) {
        await requirePermission("users:update");

        const session = await auth();
        if (!session?.user?.id || !session.user.tenantId) {
            throw new Error("Aucune Wakala sélectionnée");
        }

        // Vérifier si l'utilisateur existe
        const existing = await userRepository.findById(id);
        if (!existing) {
            throw new Error("Utilisateur introuvable");
        }

        const membership = existing.TenantUser.find(
            (item) => item.Tenant.id === session.user.tenantId && item.active
        );
        if (!membership) {
            throw new Error("Cet utilisateur n'appartient pas à la Wakala sélectionnée");
        }

        // Si l'email change, vérifier qu'il n'existe pas déjà
        const email = data.email?.trim().toLowerCase();
        if (email && email !== existing.email) {
            const duplicate = await userRepository.findByEmail(email);
            if (duplicate) {
                throw new Error("Un utilisateur avec cet email existe déjà");
            }
        }

        // Hasher le mot de passe si fourni
        if (data.roleId) {
            const role = await prisma.role.findUnique({
                where: { id: data.roleId },
                select: { id: true },
            });
            if (!role) {
                throw new Error("Rôle introuvable");
            }
            if (id === session.user.id && data.roleId !== membership.Role.id) {
                throw new Error("Vous ne pouvez pas modifier votre propre rôle");
            }
        }

        const updateData: { name?: string; email?: string; password?: string } = {
            name: data.name?.trim(),
            email,
        };
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 12);
        }

        const user = await prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id },
                data: updateData,
                select: { id: true, name: true, email: true, active: true, updatedAt: true },
            });

            if (data.roleId && data.roleId !== membership.Role.id) {
                await tx.tenantUser.update({
                    where: {
                        userId_tenantId: {
                            userId: id,
                            tenantId: session.user.tenantId!,
                        },
                    },
                    data: { roleId: data.roleId },
                });
            }

            return updatedUser;
        });

        // Log audit
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
    async changeUserRole(_userId: string, _roleId: string) {
        void _userId;
        void _roleId;
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
