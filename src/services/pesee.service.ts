import { peseeRepository, type PeseeTotals } from "@/repositories/pesee.repository";
import { pretCaisseRepository } from "@/repositories/pret-caisse.repository";
import { typeCaisseRepository } from "@/repositories/type-caisse.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import {
    buildCreatePeseeSchema,
    buildUpdatePeseeSchema,
    type CreatePeseeInput,
    type UpdatePeseeInput,
} from "@/validators/pesee.validator";

export function computeTotals(tareKg: number, grossWeights: number[]): PeseeTotals {
    const tare = new Prisma.Decimal(tareKg);
    const nombreCaisses = grossWeights.length;

    const poidsBrutTotal = grossWeights.reduce(
        (sum, poids) => sum.add(new Prisma.Decimal(poids)),
        new Prisma.Decimal(0)
    );
    const poidsTareTotal = tare.mul(nombreCaisses);
    const poidsNetTotal = poidsBrutTotal.sub(poidsTareTotal);

    return {
        nombreCaisses,
        poidsBrutTotal,
        poidsTareTotal,
        poidsNetTotal,
        poidsBrutMoyen: poidsBrutTotal.div(nombreCaisses),
        poidsNetMoyen: poidsNetTotal.div(nombreCaisses),
    };
}

function toNumber(value: Prisma.Decimal | number): number {
    return typeof value === "number" ? value : value.toNumber();
}

type PeseeWithRelations = NonNullable<Awaited<ReturnType<typeof peseeRepository.findById>>>;

function reshape(pesee: PeseeWithRelations) {
    return {
        id: pesee.id,
        livraisonId: pesee.livraisonId,
        typeCaisseId: pesee.typeCaisseId,
        typeCaisse: pesee.TypeCaisse,
        typeDateId: pesee.typeDateId,
        typeDate: pesee.TypeDate,
        tareKg: toNumber(pesee.tareKg),
        nombreCaisses: pesee.nombreCaisses,
        poidsBrutTotal: toNumber(pesee.poidsBrutTotal),
        poidsTareTotal: toNumber(pesee.poidsTareTotal),
        poidsNetTotal: toNumber(pesee.poidsNetTotal),
        poidsBrutMoyen: toNumber(pesee.poidsBrutMoyen),
        poidsNetMoyen: toNumber(pesee.poidsNetMoyen),
        caisses: pesee.Caisses?.map((c) => ({
            id: c.id,
            ordre: c.ordre,
            poidsBrut: toNumber(c.poidsBrut),
        })),
        livraison: pesee.Livraison,
        createdAt: pesee.createdAt,
    };
}

/**
 * Recalcule la quantité livrée agrégée d'une livraison à partir de toutes ses
 * sessions de pesée, et répercute la différence sur le stock daté associé.
 * Doit toujours être appelé à l'intérieur de la même transaction que la pesée.
 */
async function syncLivraisonWithPesees(
    tx: Prisma.TransactionClient,
    tenantId: string,
    livraisonId: string
) {
    const [livraison, pesees] = await Promise.all([
        tx.livraison.findFirst({
            where: { id: livraisonId, tenantId },
            include: { StockDate: true },
        }),
        tx.pesee.findMany({ where: { livraisonId, tenantId } }),
    ]);

    if (!livraison) {
        throw new Error("Livraison introuvable dans cette Wakala");
    }

    const totalNet = pesees.reduce(
        (sum, p) => sum.add(p.poidsNetTotal as unknown as Prisma.Decimal),
        new Prisma.Decimal(0)
    );
    const nouvelleQuantiteLivree = totalNet.toNumber();

    const etaitNonNegociee = livraison.quantiteAcceptee === livraison.quantiteLivree;
    const nouvelleQuantiteAcceptee = etaitNonNegociee
        ? nouvelleQuantiteLivree
        : Math.min(livraison.quantiteAcceptee, nouvelleQuantiteLivree);

    await tx.livraison.update({
        where: { id: livraisonId },
        data: {
            quantiteLivree: nouvelleQuantiteLivree,
            quantiteAcceptee: nouvelleQuantiteAcceptee,
            updatedAt: new Date(),
        },
    });

    // Regrouper les pesées par typeDateId : une ligne de StockDate par groupe.
    const groups = new Map<string, Prisma.Decimal>();
    for (const p of pesees) {
        const current = groups.get(p.typeDateId) ?? new Prisma.Decimal(0);
        groups.set(p.typeDateId, current.add(p.poidsNetTotal as unknown as Prisma.Decimal));
    }

    for (const [typeDateId, netTotal] of groups) {
        const nouvelleQuantite = netTotal.toNumber();
        const existingStock = livraison.StockDate.find((s) => s.typeDateId === typeDateId);

        if (existingStock) {
            const difference = nouvelleQuantite - existingStock.quantite;
            const nouvelleQuantiteDisponible = existingStock.quantiteDisponible + difference;

            if (nouvelleQuantiteDisponible < 0) {
                throw new Error(
                    "Impossible de mettre à jour le stock : une partie de la quantité livrée a déjà été consommée (conditionnement, sortie ou vente)"
                );
            }

            await tx.stockDate.update({
                where: { id: existingStock.id },
                data: {
                    quantite: nouvelleQuantite,
                    quantiteDisponible: nouvelleQuantiteDisponible,
                    updatedAt: new Date(),
                },
            });
        } else {
            await tx.stockDate.create({
                data: {
                    id: `stock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    quantite: nouvelleQuantite,
                    quantiteDisponible: nouvelleQuantite,
                    dateEntree: livraison.dateLivraison,
                    typeDateId,
                    livraisonId,
                    tenantId,
                    updatedAt: new Date(),
                },
            });
        }
    }
}

/**
 * Retourne automatiquement les caisses prêtées à l'agriculteur pour ce type de
 * caisse, sur la base du nombre RÉEL de caisses pesées (pas la quantité
 * déclarée à la création de la livraison). Doit être appelé dans la même
 * transaction que la pesée.
 */
export async function retournerCaissesAutomatiquement(
    tx: Prisma.TransactionClient,
    tenantId: string,
    agriculteurId: string,
    typeCaisseId: string,
    nombreCaissesPesees: number,
    numeroLot: string
) {
    const pretEnCours = await pretCaisseRepository.findEnCoursByAgriculteurEtType(
        agriculteurId,
        typeCaisseId,
        tenantId,
        tx
    );

    if (!pretEnCours) return;

    const nombreRestant = pretEnCours.nombrePrete - pretEnCours.nombreRetourne;
    const quantiteARetourner = Math.min(nombreCaissesPesees, nombreRestant);
    if (quantiteARetourner <= 0) return;

    await pretCaisseRepository.retournerCaisses(
        pretEnCours.id,
        quantiteARetourner,
        tenantId,
        `Retour automatique après pesée de la livraison ${numeroLot}`,
        tx
    );

    const typeCaisse = await typeCaisseRepository.findById(tenantId, typeCaisseId, tx);
    if (typeCaisse) {
        await typeCaisseRepository.update(
            tenantId,
            typeCaisseId,
            { stockDisponible: typeCaisse.stockDisponible + quantiteARetourner },
            tx
        );
    }
}

export const peseeService = {
    async getAll(tenantId: string, userId: string) {
        await requirePermission("pesee:read");
        const pesees = await peseeRepository.findAll(tenantId);
        return pesees.map(reshape);
    },

    async getById(tenantId: string, userId: string, id: string) {
        await requirePermission("pesee:read");

        const pesee = await peseeRepository.findById(tenantId, id);
        if (!pesee) {
            throw new Error("Pesée introuvable dans cette Wakala");
        }

        return reshape(pesee);
    },

    async getByLivraisonId(tenantId: string, userId: string, livraisonId: string) {
        await requirePermission("pesee:read");
        const pesees = await peseeRepository.findByLivraisonId(tenantId, livraisonId);
        return pesees.map(reshape);
    },

    /**
     * Crée une session de pesée pour un type de caisse d'une livraison.
     * Les poids envoyés par le client sont toujours revalidés contre la tare
     * réelle stockée en base avant tout calcul de total.
     */
    async create(tenantId: string, userId: string, data: CreatePeseeInput) {
        await requirePermission("pesee:create");

        const livraisonTypeCaisse = await prisma.livraisonTypeCaisse.findFirst({
            where: {
                livraisonId: data.livraisonId,
                typeCaisseId: data.typeCaisseId,
                typeDateId: data.typeDateId,
            },
            include: {
                Livraison: { select: { id: true, numeroLot: true, tenantId: true, agriculteurId: true } },
                TypeCaisse: { select: { id: true, nom: true, poidsKg: true, tenantId: true } },
            },
        });

        if (!livraisonTypeCaisse || livraisonTypeCaisse.Livraison.tenantId !== tenantId) {
            throw new Error("Cette combinaison de type de caisse et type de datte n'est pas utilisée dans cette livraison");
        }

        const existingPesee = await peseeRepository.findByLivraisonTypeCaisseAndTypeDate(
            tenantId,
            data.livraisonId,
            data.typeCaisseId,
            data.typeDateId
        );
        if (existingPesee) {
            throw new Error(
                "Une pesée existe déjà pour ce type de caisse et ce type de datte sur cette livraison. Modifiez-la plutôt."
            );
        }

        const tareKg = livraisonTypeCaisse.TypeCaisse.poidsKg;
        const schema = buildCreatePeseeSchema(tareKg);
        const validated = schema.parse(data);

        const grossWeights = validated.caisses.map((c) => c.poidsBrut);
        const totals = computeTotals(tareKg, grossWeights);

        const pesee = await prisma.$transaction(async (tx) => {
            const created = await peseeRepository.create(
                tenantId,
                data.livraisonId,
                data.typeCaisseId,
                data.typeDateId,
                tareKg,
                grossWeights,
                totals,
                tx
            );

            await syncLivraisonWithPesees(tx, tenantId, data.livraisonId);

            await retournerCaissesAutomatiquement(
                tx,
                tenantId,
                livraisonTypeCaisse.Livraison.agriculteurId,
                data.typeCaisseId,
                totals.nombreCaisses,
                livraisonTypeCaisse.Livraison.numeroLot
            );

            await auditService.log(
                {
                    tenantId,
                    actorId: userId,
                    action: "CREATE_PESEE",
                    targetId: created.id,
                    description: `Pesée créée pour la livraison ${livraisonTypeCaisse.Livraison.numeroLot} (${livraisonTypeCaisse.TypeCaisse.nom})`,
                    details: {
                        typeCaisse: livraisonTypeCaisse.TypeCaisse.nom,
                        nombreCaisses: totals.nombreCaisses,
                        poidsBrutTotal: totals.poidsBrutTotal.toNumber(),
                        poidsNetTotal: totals.poidsNetTotal.toNumber(),
                    },
                },
                tx
            );

            return created;
        }, { timeout: 15000, maxWait: 10000 });

        return reshape(pesee);
    },

    /**
     * Remplace les caisses d'une session de pesée existante et recalcule ses totaux
     */
    async update(tenantId: string, userId: string, data: UpdatePeseeInput) {
        await requirePermission("pesee:update");

        const existing = await peseeRepository.findById(tenantId, data.id);
        if (!existing) {
            throw new Error("Pesée introuvable dans cette Wakala");
        }

        const typeCaisse = await prisma.typeCaisse.findUnique({
            where: { id: existing.typeCaisseId },
            select: { poidsKg: true },
        });
        const tareKg = typeCaisse?.poidsKg ?? 0;

        const schema = buildUpdatePeseeSchema(tareKg);
        const validated = schema.parse(data);

        const grossWeights = validated.caisses.map((c) => c.poidsBrut);
        const totals = computeTotals(tareKg, grossWeights);

        const pesee = await prisma.$transaction(async (tx) => {
            const updated = await peseeRepository.update(
                tenantId,
                data.id,
                tareKg,
                grossWeights,
                totals,
                tx
            );

            await syncLivraisonWithPesees(tx, tenantId, existing.livraisonId);

            await auditService.log(
                {
                    tenantId,
                    actorId: userId,
                    action: "UPDATE_PESEE",
                    targetId: updated.id,
                    description: `Pesée mise à jour (${existing.TypeCaisse?.nom ?? ""})`,
                    details: {
                        nombreCaisses: totals.nombreCaisses,
                        poidsBrutTotal: totals.poidsBrutTotal.toNumber(),
                        poidsNetTotal: totals.poidsNetTotal.toNumber(),
                    },
                },
                tx
            );

            return updated;
        }, { timeout: 15000, maxWait: 10000 });

        return reshape(pesee);
    },

    async delete(tenantId: string, userId: string, id: string) {
        await requirePermission("pesee:delete");

        const existing = await peseeRepository.findById(tenantId, id);
        if (!existing) {
            throw new Error("Pesée introuvable dans cette Wakala");
        }

        await prisma.$transaction(async (tx) => {
            await peseeRepository.delete(tenantId, id, tx);
            await syncLivraisonWithPesees(tx, tenantId, existing.livraisonId);

            await auditService.log(
                {
                    tenantId,
                    actorId: userId,
                    action: "DELETE_PESEE",
                    targetId: id,
                    description: `Pesée supprimée (${existing.TypeCaisse?.nom ?? ""})`,
                    details: {
                        poidsNetTotal: toNumber(existing.poidsNetTotal),
                    },
                },
                tx
            );
        }, { timeout: 15000, maxWait: 10000 });

        return { success: true };
    },
};
