import { roleRepository } from "@/repositories/role.repository";

export class RoleService {
    async getAllRoles() {
        return roleRepository.findAll();
    }

    async getRoleById(id: string) {
        return roleRepository.findById(id);
    }

    async createRole(data: { name: string; description?: string }) {
        return roleRepository.create({
            name: data.name,
            description: data.description,
        });
    }

    async updateRole(id: string, data: { name?: string; description?: string }) {
        return roleRepository.update(id, data);
    }

    async deleteRole(id: string) {
        return roleRepository.delete(id);
    }
}

export const roleService = new RoleService();
