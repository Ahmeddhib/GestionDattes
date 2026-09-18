import type { Prisma, ProprietaireCaisse, TypeMouvementCaisse } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { auditService } from "@/services/audit.service";
import {
    caisseStockRepository,
    creerMouvementCaisse,
    decrementerStockProprietaire,
    incrementerStockProprietaire,
    type CaisseSource,
} from "@/repositories/caisse-stock.repository";
import type {
    CancelReceptionCaissesInput,
    CreateReceptionCaissesInput,
} from "@/validators/caisse-stock.validator";

async function verifierReferences(
    tx: Prisma.TransactionClient,
    tenantId: string,
    clientIds: string[],
    typeCaisseIds: string[]
) {
    const [clients, types] = await Promise.all([
        tx.client.count({ where: { tenantId, id: { in: [...new Set(clientIds)] } } }),
        tx.typeCaisse.count({ where: { tenantId, id: { in: [...new Set(typeCaisseIds)] } } }),
    ]);
    if (clients !== new Set(clientIds).size) throw new Error("Client introuvable dans cette Wakala");
    if (types !== new Set(typeCaisseIds).size) throw new Error("Type de caisse introuvable dans cette Wakala");
}

export async function ajusterStockDansTransaction(
    tx: Prisma.TransactionClient,
    tenantId: string,
    userId: string,
    data: {
        proprietaire: ProprietaireCaisse;
        clientProprietaireId?: string;
        typeCaisseId: string;
        nouvelleQuantite: number;
        motif: string;
    }
) {
    if (!Number.isInteger(data.nouvelleQuantite) || data.nouvelleQuantite < 0) {
        throw new Error("Quantité invalide");
    }
    await verifierReferences(tx, tenantId, data.clientProprietaireId ? [data.clientProprietaireId] : [], [data.typeCaisseId]);
    const actuel = data.proprietaire === "WAKALA"
        ? await tx.stockCaisseWakala.findUnique({ where: { tenantId_typeCaisseId: { tenantId, typeCaisseId: data.typeCaisseId } } })
        : data.clientProprietaireId
            ? await tx.stockCaisseClient.findUnique({ where: { tenantId_clientId_typeCaisseId: { tenantId, clientId: data.clientProprietaireId, typeCaisseId: data.typeCaisseId } } })
            : null;
    const difference = data.nouvelleQuantite - (actuel?.quantite ?? 0);
    if (difference === 0) return actuel;

    const source: CaisseSource = {
        proprietaire: data.proprietaire,
        clientProprietaireId: data.clientProprietaireId,
        typeCaisseId: data.typeCaisseId,
        quantite: Math.abs(difference),
    };
    if (difference > 0) await incrementerStockProprietaire(tx, tenantId, source);
    else await decrementerStockProprietaire(tx, tenantId, source);
    await creerMouvementCaisse(tx, {
        tenantId,
        createdById: userId,
        source,
        type: "AJUSTEMENT",
        direction: difference > 0 ? "ENTREE" : "SORTIE",
        description: data.motif,
    });
    await auditService.log({
        tenantId,
        actorId: userId,
        action: "ADJUST_STOCK_CAISSES",
        description: `Ajustement de stock caisses (${difference > 0 ? "+" : ""}${difference})`,
        details: data,
    }, tx);
    return { quantite: data.nouvelleQuantite };
}

export async function appliquerSortiesCaisses(
    tx: Prisma.TransactionClient,
    params: {
        tenantId: string;
        userId: string;
        sources: CaisseSource[];
        type: TypeMouvementCaisse;
        venteId?: string;
        pretCaisseId?: string;
        peseeId?: string;
        reference?: string;
        description?: string;
    }
) {
    const clients = params.sources.flatMap((source) => source.clientProprietaireId ? [source.clientProprietaireId] : []);
    await verifierReferences(tx, params.tenantId, clients, params.sources.map((source) => source.typeCaisseId));
    for (const source of params.sources) {
        await decrementerStockProprietaire(tx, params.tenantId, source);
        await creerMouvementCaisse(tx, {
            tenantId: params.tenantId,
            createdById: params.userId,
            source,
            type: params.type,
            direction: "SORTIE",
            venteId: params.venteId,
            pretCaisseId: params.pretCaisseId,
            peseeId: params.peseeId,
            reference: params.reference,
            description: params.description,
        });
    }
}

export async function appliquerEntreesCaisses(
    tx: Prisma.TransactionClient,
    params: {
        tenantId: string;
        userId: string;
        sources: CaisseSource[];
        type: TypeMouvementCaisse;
        pretCaisseId?: string;
        peseeId?: string;
        reference?: string;
        description?: string;
    }
) {
    for (const source of params.sources) {
        await incrementerStockProprietaire(tx, params.tenantId, source);
        await creerMouvementCaisse(tx, {
            tenantId: params.tenantId,
            createdById: params.userId,
            source,
            type: params.type,
            direction: "ENTREE",
            pretCaisseId: params.pretCaisseId,
            peseeId: params.peseeId,
            reference: params.reference,
            description: params.description,
        });
    }
}

export const caisseStockService = {
    async getVueGlobale(tenantId: string, userId: string) {
        await checkPermission(userId, "caisse:read");
        return caisseStockRepository.getVueGlobale(tenantId);
    },

    async getReceptionsPage(tenantId: string, userId: string, params: Parameters<typeof caisseStockRepository.getReceptionsPage>[1]) {
        await checkPermission(userId, "caisse:read");
        return caisseStockRepository.getReceptionsPage(tenantId, params);
    },

    async getStocksClientsPage(tenantId: string, userId: string, params: Parameters<typeof caisseStockRepository.getStocksClientsPage>[1]) {
        await checkPermission(userId, "caisse:read");
        return caisseStockRepository.getStocksClientsPage(tenantId, params);
    },

    async getMouvementsPage(tenantId: string, userId: string, params: Parameters<typeof caisseStockRepository.getMouvementsPage>[1]) {
        await checkPermission(userId, "caisse:movement:read");
        return caisseStockRepository.getMouvementsPage(tenantId, params);
    },

    async creerReception(tenantId: string, userId: string, input: CreateReceptionCaissesInput) {
        await checkPermission(userId, "caisse:reception:create");
        return prisma.$transaction(async (tx) => {
            await verifierReferences(tx, tenantId, [input.clientId], input.lignes.map((ligne) => ligne.typeCaisseId));
            const numero = `RC-${input.date.getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
            const reception = await tx.receptionCaisses.create({
                data: {
                    numero,
                    tenantId,
                    clientId: input.clientId,
                    date: input.date,
                    matriculeCamion: input.matriculeCamion || null,
                    chauffeur: input.chauffeur || null,
                    observations: input.observations || null,
                    createdById: userId,
                    Lignes: { create: input.lignes },
                },
                include: { Client: true, Lignes: { include: { TypeCaisse: true } } },
            });

            for (const ligne of input.lignes) {
                const source: CaisseSource = {
                    proprietaire: "CLIENT",
                    clientProprietaireId: input.clientId,
                    typeCaisseId: ligne.typeCaisseId,
                    quantite: ligne.quantite,
                };
                await incrementerStockProprietaire(tx, tenantId, source);
                await creerMouvementCaisse(tx, {
                    tenantId,
                    createdById: userId,
                    source,
                    type: "RECEPTION_CLIENT",
                    direction: "ENTREE",
                    receptionId: reception.id,
                    reference: numero,
                });
            }

            await auditService.log({
                tenantId,
                actorId: userId,
                action: "CREATE_RECEPTION_CAISSES",
                targetId: reception.id,
                description: `Réception ${numero} créée pour ${reception.Client.nom}`,
                details: { nombreLignes: input.lignes.length, quantiteTotale: input.lignes.reduce((s, l) => s + l.quantite, 0) },
            }, tx);
            return reception;
        }, { timeout: 20_000, maxWait: 10_000 });
    },

    async annulerReception(tenantId: string, userId: string, input: CancelReceptionCaissesInput) {
        await checkPermission(userId, "caisse:reception:cancel");
        return prisma.$transaction(async (tx) => {
            const reception = await tx.receptionCaisses.findFirst({
                where: { id: input.receptionId, tenantId },
                include: { Client: true, Lignes: true },
            });
            if (!reception) throw new Error("Réception introuvable dans cette Wakala");
            if (reception.statut === "ANNULEE") throw new Error("Cette réception est déjà annulée");

            for (const ligne of reception.Lignes) {
                const source: CaisseSource = {
                    proprietaire: "CLIENT",
                    clientProprietaireId: reception.clientId,
                    typeCaisseId: ligne.typeCaisseId,
                    quantite: ligne.quantite,
                };
                await decrementerStockProprietaire(tx, tenantId, source);
                await creerMouvementCaisse(tx, {
                    tenantId,
                    createdById: userId,
                    source,
                    type: "ANNULATION_RECEPTION",
                    direction: "SORTIE",
                    receptionId: reception.id,
                    reference: reception.numero,
                    description: input.motif,
                });
            }

            const updated = await tx.receptionCaisses.update({
                where: { id: reception.id },
                data: { statut: "ANNULEE", annuleParId: userId, annuleeLe: new Date(), motifAnnulation: input.motif },
            });
            await auditService.log({
                tenantId,
                actorId: userId,
                action: "CANCEL_RECEPTION_CAISSES",
                targetId: reception.id,
                description: `Réception ${reception.numero} annulée`,
                details: { motif: input.motif },
            }, tx);
            return updated;
        }, { timeout: 20_000, maxWait: 10_000 });
    },

    async ajusterStock(tenantId: string, userId: string, data: {
        proprietaire: ProprietaireCaisse;
        clientProprietaireId?: string;
        typeCaisseId: string;
        nouvelleQuantite: number;
        motif: string;
    }) {
        await checkPermission(userId, "caisse:adjust");
        return prisma.$transaction(
            (tx) => ajusterStockDansTransaction(tx, tenantId, userId, data),
            { timeout: 20_000, maxWait: 10_000 }
        );
    },
};
