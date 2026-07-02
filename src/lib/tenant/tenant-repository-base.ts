/**
 * Base Repository pour toutes les entités multi-tenant
 * Fournit un filtrage automatique par tenantId pour éviter les fuites de données
 */

import { PAGINATION } from "@/constants/pagination";

export interface TenantRepositoryOptions {
    page?: number;
    pageSize?: number;
    search?: string;
    orderBy?: any;
    select?: any;
    include?: any;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/**
 * Classe de base pour les repositories multi-tenant
 * Assure que toutes les requêtes incluent automatiquement le tenantId
 */
export class TenantRepositoryBase<T> {
    constructor(
        protected model: any,
        protected tenantId: string
    ) {
        if (!tenantId) {
            throw new Error("tenantId is required for TenantRepositoryBase");
        }
    }

    /**
     * Construit la clause WHERE en incluant automatiquement tenantId
     */
    protected buildWhere(additionalWhere?: any) {
        return {
            tenantId: this.tenantId,
            ...additionalWhere,
        };
    }

    /**
     * Récupère tous les enregistrements paginés
     */
    async findAll(options?: TenantRepositoryOptions): Promise<PaginatedResult<T>> {
        const page = options?.page || 1;
        const pageSize = Math.min(
            options?.pageSize || PAGINATION.DEFAULT_PAGE_SIZE,
            PAGINATION.MAX_PAGE_SIZE
        );

        const where = this.buildWhere();

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: options?.orderBy || { createdAt: "desc" },
                select: options?.select,
                include: options?.include,
            }),
            this.model.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    /**
     * Récupère tous les enregistrements sans pagination
     */
    async findMany(additionalWhere?: any, options?: any): Promise<T[]> {
        const where = this.buildWhere(additionalWhere);

        return this.model.findMany({
            where,
            ...options,
        });
    }

    /**
     * Récupère un enregistrement par ID
     * Vérifie automatiquement que l'enregistrement appartient au tenant
     */
    async findById(id: string, options?: { select?: any; include?: any }): Promise<T | null> {
        return this.model.findFirst({
            where: this.buildWhere({ id }),
            select: options?.select,
            include: options?.include,
        });
    }

    /**
     * Récupère un enregistrement par ID (throw si non trouvé)
     */
    async findByIdOrThrow(
        id: string,
        options?: { select?: any; include?: any }
    ): Promise<T> {
        const record = await this.findById(id, options);
        if (!record) {
            throw new Error(`Enregistrement ${id} introuvable ou n'appartient pas à ce tenant`);
        }
        return record;
    }

    /**
     * Récupère un enregistrement unique
     */
    async findUnique(additionalWhere: any, options?: any): Promise<T | null> {
        const where = this.buildWhere(additionalWhere);

        return this.model.findFirst({
            where,
            ...options,
        });
    }

    /**
     * Crée un enregistrement
     * Injecte automatiquement le tenantId
     */
    async create(data: any, options?: { select?: any; include?: any }): Promise<T> {
        return this.model.create({
            data: {
                ...data,
                tenantId: this.tenantId, // Injection automatique
            },
            select: options?.select,
            include: options?.include,
        });
    }

    /**
     * Met à jour un enregistrement
     * Vérifie automatiquement que l'enregistrement appartient au tenant
     */
    async update(
        id: string,
        data: any,
        options?: { select?: any; include?: any }
    ): Promise<T> {
        // Vérifier d'abord que l'enregistrement appartient au tenant
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error(
                `Enregistrement ${id} introuvable ou n'appartient pas à ce tenant`
            );
        }

        return this.model.update({
            where: { id },
            data,
            select: options?.select,
            include: options?.include,
        });
    }

    /**
     * Supprime un enregistrement
     * Vérifie automatiquement que l'enregistrement appartient au tenant
     */
    async delete(id: string, options?: { select?: any }): Promise<T> {
        // Vérifier d'abord que l'enregistrement appartient au tenant
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error(
                `Enregistrement ${id} introuvable ou n'appartient pas à ce tenant`
            );
        }

        return this.model.delete({
            where: { id },
            select: options?.select,
        });
    }

    /**
     * Compte les enregistrements
     */
    async count(additionalWhere?: any): Promise<number> {
        const where = this.buildWhere(additionalWhere);
        return this.model.count({ where });
    }

    /**
     * Vérifie si un enregistrement existe
     */
    async exists(id: string): Promise<boolean> {
        const count = await this.model.count({
            where: this.buildWhere({ id }),
        });
        return count > 0;
    }
}

/**
 * Factory function pour créer un repository tenant-aware
 * Usage: const agriculteurRepo = createTenantRepository(prisma.agriculteur, tenantId);
 */
export function createTenantRepository<T>(model: any, tenantId: string) {
    return new TenantRepositoryBase<T>(model, tenantId);
}
