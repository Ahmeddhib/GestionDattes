import { peseeRepository, type PeseeTotals } from "@/repositories/pesee.repository";
import { pretCaisseRepository } from "@/repositories/pret-caisse.repository";
import { typeCaisseRepository } from "@/repositories/type-caisse.repository";
import { typeDateRepository } from "@/repositories/type-date.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { assertSaisonOuverte } from "@/lib/saison-guard";
import {
    buildCreatePeseeSchema,
    buildUpdatePeseeSchema,
    buildPeseeCaisseSchema,
    type CreatePeseeInput,
    type UpdatePeseeInput,
} from "@/validators/pesee.validator";

/**
 * Une Pesee n'a pas de saisonId propre : elle appartient à la saison de sa
 * livraison. Ce raccourci évite de dupliquer la même requête dans create,
 * update et delete.
 */
async function assertLivraisonSaisonOuverte(tenantId: string, livraisonId: string) {
    const livraison = await prisma.livraison.findFirst({
        where: { id: livraisonId, tenantId },
        select: { saisonId: true },
    });

    if (!livraison) {
        throw new Error("Livraison introuvable dans cette Wakala");
    }

    await assertSaisonOuverte(tenantId, livraison.saisonId);
}

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

export type LignePeseeInput = {
    typeDateId: string;
    typeCaisseId: string;
    quantiteDeclaree: number;
    prixKg: number;
    quantiteAcceptee?: number;
    caisses: { poidsBrut: number }[];
};

/**
 * Résout et revalide chaque ligne déclarée (type datte + type caisse + poids
 * pesés) contre les vraies données serveur, puis calcule ses totaux. Point
 * d'entrée UNIQUE partagé par la création d'une livraison (assistant de
 * pesée) et par sa resynchronisation lors d'une modification — le calcul du
 * poids (tare, net, moyennes) ne doit jamais être dupliqué ailleurs.
 */
export async function resolveLignesPesee(tenantId: string, lignes: LignePeseeInput[]) {
    return Promise.all(
        lignes.map(async (ligne) => {
            const typeDate = await typeDateRepository.findById(ligne.typeDateId, tenantId);
            if (!typeDate) {
                throw new Error(`Type de datte introuvable: ${ligne.typeDateId}`);
            }
            const typeCaisse = await typeCaisseRepository.findById(tenantId, ligne.typeCaisseId);
            if (!typeCaisse) {
                throw new Error(`Type de caisse introuvable: ${ligne.typeCaisseId}`);
            }

            const caisseSchema = buildPeseeCaisseSchema(typeCaisse.poidsKg);
            const validatedCaisses = ligne.caisses.map((c) => caisseSchema.parse(c));
            const grossWeights = validatedCaisses.map((c) => c.poidsBrut);
            const totals = computeTotals(typeCaisse.poidsKg, grossWeights);

            // La quantité acceptée (négociable) ne sert qu'au calcul du montant —
            // elle ne peut jamais dépasser le poids net réellement mesuré, et
            // retombe sur celui-ci si absente ou invalide.
            const poidsNetTotal = totals.poidsNetTotal.toNumber();
            const quantiteAcceptee =
                ligne.quantiteAcceptee !== undefined &&
                Number.isFinite(ligne.quantiteAcceptee) &&
                ligne.quantiteAcceptee > 0 &&
                ligne.quantiteAcceptee <= poidsNetTotal
                    ? ligne.quantiteAcceptee
                    : poidsNetTotal;

            return {
                typeDateId: ligne.typeDateId,
                typeCaisseId: ligne.typeCaisseId,
                quantiteDeclaree: ligne.quantiteDeclaree,
                prixKg: ligne.prixKg,
                quantiteAcceptee,
                typeCaisse,
                typeDate,
                grossWeights,
                totals,
            };
        })
    );
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
        prixKg: pesee.prixKg,
        quantiteAcceptee: toNumber(pesee.quantiteAcceptee),
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
export async function syncLivraisonWithPesees(
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

    // La quantité acceptée globale n'est qu'une somme d'information : la vraie
    // négociation vit au niveau de chaque Pesee.quantiteAcceptee (utilisée pour
    // le montant du bon d'achat). Le stock, lui, reste basé sur poidsNetTotal.
    const totalAcceptee = pesees.reduce(
        (sum, p) => sum.add(p.quantiteAcceptee as unknown as Prisma.Decimal),
        new Prisma.Decimal(0)
    );
    const nouvelleQuantiteAcceptee = totalAcceptee.toNumber();

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
                    // Le lot hérite de la saison de sa livraison, jamais de la
                    // saison ouverte du moment.
                    saisonOrigineId: livraison.saisonId,
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
    async getAll(tenantId: string, userId: string, opts?: { saisonId?: string }) {
        await requirePermission("pesee:read");
        const pesees = await peseeRepository.findAll(tenantId, opts);
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
        await assertLivraisonSaisonOuverte(tenantId, data.livraisonId);

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
                livraisonTypeCaisse.Livraison.agriculteurId,
                data.typeCaisseId,
                data.typeDateId,
                tareKg,
                grossWeights,
                totals,
                0,
                totals.poidsNetTotal.toNumber(),
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

        await assertLivraisonSaisonOuverte(tenantId, existing.livraisonId);

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
                existing.prixKg,
                toNumber(existing.quantiteAcceptee),
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

        await assertLivraisonSaisonOuverte(tenantId, existing.livraisonId);

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
