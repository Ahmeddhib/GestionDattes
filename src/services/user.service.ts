import { userRepository } from "@/repositories/user.repository";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

export class UserService {
    async getAllUsers() {
        return userRepository.findAll();
    }

    async getUserById(id: string) {
        return userRepository.findById(id);
    }

    async createUser(data: {
        name: string;
        email: string;
        password: string;
        roleId: string;
    }) {
        // Check if email already exists
        const existingUser = await userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new Error("Un utilisateur avec cet email existe déjà");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create user
        return userRepository.create({
            id: createId(),
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: {
                connect: { id: data.roleId },
            },
        });
    }

    async updateUser(
        id: string,
        data: {
            name?: string;
            email?: string;
            password?: string;
            roleId?: string;
        }
    ) {
        const updateData: any = {};

        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = data.email;
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }
        if (data.roleId) {
            updateData.role = {
                connect: { id: data.roleId },
            };
        }

        return userRepository.update(id, updateData);
    }

    async activateUser(id: string) {
        return userRepository.activate(id);
    }

    async deactivateUser(id: string) {
        return userRepository.deactivate(id);
    }
}

export const userService = new UserService();
