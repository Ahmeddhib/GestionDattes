import { userRepository } from "@/repositories/user.repository";
import { requirePermission } from "@/lib/permissions";
import { auditService } from "./audit.service";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const userService = {
    async getUsers(options?: { page?: number; pageSize?: number; search?: string; active?: boolean }) {
        await requirePermission("users:read");
        return userRepository.findAll(options);
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

        // Vérifier si l'email existe déjà
        const existing = await userRepository.findByEmail(data.email);
        if (existing) {
            throw new Error("Un utilisateur avec cet email existe déjà");
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await userRepository.create({
            ...data,
            password: hashedPassword,
        });

        // Log audit
        const session = await auth();
        if (session?.user?.id) {
            await auditService.log({
                actorId: session.user.id,
                action: "CREATE_USER",
                description: `Création de l'utilisateur "${data.name}" (${data.email})`,
                targetId: user.id,
            });
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
        if (session?.user?.id) {
            await auditService.log({
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
        if (session?.user?.id) {
            await auditService.log({
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
        if (session?.user?.id) {
            await auditService.log({
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
        if (session?.user?.id) {
            await auditService.log({
                actorId: session.user.id,
                action: "UPDATE_USER",
                description: `Suppression de l'utilisateur "${user.name}"`,
                targetId: id,
            });
        }

        return user;
    },

    async changeUserRole(userId: string, roleId: string) {
        await requirePermission("users:update");

        const user = await userRepository.update(userId, { roleId });

        // Log audit
        const session = await auth();
        if (session?.user?.id) {
            await auditService.log({
                actorId: session.user.id,
                action: "CHANGE_ROLE",
                description: `Changement de rôle pour "${user.name}" vers "${user.role.name}"`,
                targetId: userId,
            });
        }

        return user;
    },

    async getUsersCount(options?: { active?: boolean }) {
        await requirePermission("users:read");
        return userRepository.count(options);
    },
};
