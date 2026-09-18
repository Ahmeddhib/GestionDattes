import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Prisma } from "@/generated/prisma";

let prisma: typeof import("@/lib/prisma").prisma;
let creerMouvementCaisse: typeof import("@/repositories/caisse-stock.repository").creerMouvementCaisse;
let decrementerStockProprietaire: typeof import("@/repositories/caisse-stock.repository").decrementerStockProprietaire;
let incrementerStockProprietaire: typeof import("@/repositories/caisse-stock.repository").incrementerStockProprietaire;
let appliquerSortiesCaisses: typeof import("@/services/caisse-stock.service").appliquerSortiesCaisses;
let annulerRetoursPesee: typeof import("@/services/pret-caisse.service").annulerRetoursPesee;
let retournerSourcesPret: typeof import("@/services/pret-caisse.service").retournerSourcesPret;

const runId = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
const integrationEnabled = process.env.ALLOW_DESTRUCTIVE_TEST_DB === "stock-caisses-neon-ephemeral";
const integrationTest = integrationEnabled ? test : test.skip;
const ids = {
    user: `it-user-${runId}`,
    tenantA: `it-tenant-a-${runId}`,
    tenantB: `it-tenant-b-${runId}`,
    clientA: `it-client-a-${runId}`,
    clientB: `it-client-b-${runId}`,
    typeA: `it-type-a-${runId}`,
    typeB: `it-type-b-${runId}`,
    concurrentType: `it-type-concurrent-${runId}`,
    regionA: `it-region-a-${runId}`,
    agriculteurA: `it-agri-a-${runId}`,
    saisonA: `it-saison-a-${runId}`,
    typeDateA: `it-date-type-a-${runId}`,
    livraisonA: `it-livraison-a-${runId}`,
    peseeA: `it-pesee-a-${runId}`,
    pretA: `it-pret-a-${runId}`,
};

function transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(callback, { timeout: 20_000, maxWait: 10_000 });
}

function assertDedicatedTestDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    const branch = process.env.TEST_DATABASE_BRANCH;
    const endpointId = process.env.TEST_DATABASE_ENDPOINT_ID;
    if (process.env.ALLOW_DESTRUCTIVE_TEST_DB !== "stock-caisses-neon-ephemeral") {
        throw new Error("TEST REFUSÉ : l’exécuteur sécurisé n’a pas autorisé les écritures.");
    }
    if (!databaseUrl || !branch?.startsWith("integration-stock-caisses-") || !endpointId) {
        throw new Error("TEST REFUSÉ : branche de test éphémère non identifiée.");
    }
    const host = new URL(databaseUrl).hostname;
    if (!host.startsWith(`${endpointId}-`) && !host.startsWith(`${endpointId}.`)) {
        throw new Error("TEST REFUSÉ : DATABASE_URL ne correspond pas à l’endpoint de test attendu.");
    }
}

async function createReception(quantite: number, suffix: string) {
    return transaction(async (tx) => {
        const reception = await tx.receptionCaisses.create({
            data: {
                numero: `IT-RC-${runId}-${suffix}`,
                tenantId: ids.tenantA,
                clientId: ids.clientA,
                createdById: ids.user,
                Lignes: { create: [{ typeCaisseId: ids.typeA, quantite }] },
            },
        });
        const source = {
            proprietaire: "CLIENT" as const,
            clientProprietaireId: ids.clientA,
            typeCaisseId: ids.typeA,
            quantite,
        };
        await incrementerStockProprietaire(tx, ids.tenantA, source);
        await creerMouvementCaisse(tx, {
            tenantId: ids.tenantA,
            createdById: ids.user,
            source,
            type: "RECEPTION_CLIENT",
            direction: "ENTREE",
            receptionId: reception.id,
            reference: reception.numero,
        });
        return reception;
    });
}

beforeAll(async () => {
    if (!integrationEnabled) return;
    assertDedicatedTestDatabase();
    const [database, stockRepository, stockService, pretService] = await Promise.all([
        import("@/lib/prisma"),
        import("@/repositories/caisse-stock.repository"),
        import("@/services/caisse-stock.service"),
        import("@/services/pret-caisse.service"),
    ]);
    prisma = database.prisma;
    creerMouvementCaisse = stockRepository.creerMouvementCaisse;
    decrementerStockProprietaire = stockRepository.decrementerStockProprietaire;
    incrementerStockProprietaire = stockRepository.incrementerStockProprietaire;
    appliquerSortiesCaisses = stockService.appliquerSortiesCaisses;
    annulerRetoursPesee = pretService.annulerRetoursPesee;
    retournerSourcesPret = pretService.retournerSourcesPret;
    await prisma.user.create({
        data: { id: ids.user, name: "Integration Test", email: `${ids.user}@example.invalid`, password: "not-a-real-password" },
    });
    await prisma.tenant.createMany({
        data: [
            { id: ids.tenantA, name: "Integration A", code: `ITA-${runId}` },
            { id: ids.tenantB, name: "Integration B", code: `ITB-${runId}` },
        ],
    });
    await prisma.client.createMany({
        data: [
            { id: ids.clientA, tenantId: ids.tenantA, nom: "Client A", updatedAt: new Date() },
            { id: ids.clientB, tenantId: ids.tenantB, nom: "Client B", updatedAt: new Date() },
        ],
    });
    await prisma.typeCaisse.createMany({
        data: [
            { id: ids.typeA, tenantId: ids.tenantA, nom: `GC A ${runId}`, poidsKg: 10, updatedAt: new Date() },
            { id: ids.concurrentType, tenantId: ids.tenantA, nom: `Concurrent ${runId}`, poidsKg: 5, updatedAt: new Date() },
            { id: ids.typeB, tenantId: ids.tenantB, nom: `GC B ${runId}`, poidsKg: 10, updatedAt: new Date() },
        ],
    });
    await prisma.region.create({ data: { id: ids.regionA, tenantId: ids.tenantA, nom: "Test", code: `R-${runId}` } });
    await prisma.agriculteur.create({
        data: {
            id: ids.agriculteurA,
            tenantId: ids.tenantA,
            regionId: ids.regionA,
            code: `AGR-${runId}`,
            cin: `CIN-${runId}`,
            nom: "Agriculteur",
            prenom: "Test",
            nbPalmiers: 1,
        },
    });
    await prisma.saison.create({
        data: {
            id: ids.saisonA,
            tenantId: ids.tenantA,
            createdById: ids.user,
            nom: `Saison ${runId}`,
            dateDebut: new Date("2026-01-01T00:00:00Z"),
            dateFin: new Date("2026-12-31T23:59:59Z"),
            updatedAt: new Date(),
        },
    });
});

afterAll(async () => {
    if (!integrationEnabled) return;
    await prisma.$disconnect();
});

describe("stock de caisses sur une vraie branche PostgreSQL isolée", () => {
    integrationTest("réceptions, sorties, prêt multi-source, retour et compensation restent cohérents", async () => {
        await createReception(200, "1");
        await createReception(300, "2");

        expect((await prisma.stockCaisseClient.findUniqueOrThrow({
            where: { tenantId_clientId_typeCaisseId: { tenantId: ids.tenantA, clientId: ids.clientA, typeCaisseId: ids.typeA } },
        })).quantite).toBe(500);
        expect(await prisma.receptionCaisses.count({ where: { tenantId: ids.tenantA } })).toBe(2);
        expect(await prisma.mouvementCaisse.count({ where: { tenantId: ids.tenantA, type: "RECEPTION_CLIENT" } })).toBe(2);

        await transaction((tx) => incrementerStockProprietaire(tx, ids.tenantA, {
            proprietaire: "WAKALA", typeCaisseId: ids.typeA, quantite: 400,
        }));
        await transaction((tx) => appliquerSortiesCaisses(tx, {
            tenantId: ids.tenantA,
            userId: ids.user,
            sources: [{ proprietaire: "CLIENT", clientProprietaireId: ids.clientA, typeCaisseId: ids.typeA, quantite: 120 }],
            type: "SORTIE_VENTE",
            reference: `IT-V1-${runId}`,
        }));
        await transaction((tx) => appliquerSortiesCaisses(tx, {
            tenantId: ids.tenantA,
            userId: ids.user,
            sources: [
                { proprietaire: "CLIENT", clientProprietaireId: ids.clientA, typeCaisseId: ids.typeA, quantite: 50 },
                { proprietaire: "WAKALA", typeCaisseId: ids.typeA, quantite: 30 },
            ],
            type: "SORTIE_VENTE",
            reference: `IT-V2-${runId}`,
        }));

        const [clientAfterSales, wakalaAfterSales] = await Promise.all([
            prisma.stockCaisseClient.findUniqueOrThrow({ where: { tenantId_clientId_typeCaisseId: { tenantId: ids.tenantA, clientId: ids.clientA, typeCaisseId: ids.typeA } } }),
            prisma.stockCaisseWakala.findUniqueOrThrow({ where: { tenantId_typeCaisseId: { tenantId: ids.tenantA, typeCaisseId: ids.typeA } } }),
        ]);
        expect(clientAfterSales.quantite).toBe(330);
        expect(wakalaAfterSales.quantite).toBe(370);

        await prisma.pretCaisse.create({
            data: {
                id: ids.pretA,
                tenantId: ids.tenantA,
                agriculteurId: ids.agriculteurA,
                typeCaisseId: ids.typeA,
                saisonId: ids.saisonA,
                createdById: ids.user,
                nombrePrete: 40,
                updatedAt: new Date(),
                Sources: { create: [
                    { tenantId: ids.tenantA, typeCaisseId: ids.typeA, proprietaire: "WAKALA", quantite: 25 },
                    { tenantId: ids.tenantA, typeCaisseId: ids.typeA, proprietaire: "CLIENT", clientProprietaireId: ids.clientA, quantite: 15 },
                ] },
            },
        });
        await transaction((tx) => appliquerSortiesCaisses(tx, {
            tenantId: ids.tenantA,
            userId: ids.user,
            sources: [
                { proprietaire: "WAKALA", typeCaisseId: ids.typeA, quantite: 25 },
                { proprietaire: "CLIENT", clientProprietaireId: ids.clientA, typeCaisseId: ids.typeA, quantite: 15 },
            ],
            type: "PRET_AGRICULTEUR",
            pretCaisseId: ids.pretA,
        }));

        await prisma.typeDate.create({ data: { id: ids.typeDateA, tenantId: ids.tenantA, nom: `Date ${runId}`, updatedAt: new Date() } });
        await prisma.livraison.create({
            data: {
                id: ids.livraisonA,
                tenantId: ids.tenantA,
                agriculteurId: ids.agriculteurA,
                saisonId: ids.saisonA,
                numeroLot: `LOT-${runId}`,
                dateLivraison: new Date("2026-06-01T00:00:00Z"),
                quantiteLivree: 1,
                quantiteAcceptee: 1,
                updatedAt: new Date(),
            },
        });
        await prisma.pesee.create({
            data: {
                id: ids.peseeA,
                tenantId: ids.tenantA,
                livraisonId: ids.livraisonA,
                agriculteurId: ids.agriculteurA,
                typeCaisseId: ids.typeA,
                typeDateId: ids.typeDateA,
                tareKg: 1,
                nombreCaisses: 40,
                poidsBrutTotal: 40,
                poidsTareTotal: 40,
                poidsNetTotal: 0,
                poidsBrutMoyen: 1,
                poidsNetMoyen: 0,
                caissesRetournees: 40,
            },
        });
        await transaction(async (tx) => {
            await retournerSourcesPret(tx, {
                tenantId: ids.tenantA,
                userId: ids.user,
                pretId: ids.pretA,
                quantite: 40,
                peseeId: ids.peseeA,
            });
            await tx.pretCaisse.update({
                where: { id: ids.pretA },
                data: { nombreRetourne: 40, statut: "RETOURNE", dateRetour: new Date() },
            });
        });
        expect((await prisma.stockCaisseClient.findUniqueOrThrow({ where: { tenantId_clientId_typeCaisseId: { tenantId: ids.tenantA, clientId: ids.clientA, typeCaisseId: ids.typeA } } })).quantite).toBe(330);
        expect((await prisma.stockCaisseWakala.findUniqueOrThrow({ where: { tenantId_typeCaisseId: { tenantId: ids.tenantA, typeCaisseId: ids.typeA } } })).quantite).toBe(370);
        const returnedSources = await prisma.pretCaisseSource.findMany({
            where: { tenantId: ids.tenantA, pretCaisseId: ids.pretA },
            select: { quantite: true, quantiteRetournee: true },
        });
        expect(returnedSources.every((source) => source.quantiteRetournee === source.quantite)).toBe(true);

        await transaction((tx) => annulerRetoursPesee(tx, {
            tenantId: ids.tenantA,
            userId: ids.user,
            peseeId: ids.peseeA,
        }));
        await prisma.pesee.delete({ where: { id: ids.peseeA } });
        expect((await prisma.pretCaisse.findUniqueOrThrow({ where: { id: ids.pretA } })).nombreRetourne).toBe(0);
        expect(await prisma.mouvementCaisse.count({ where: { tenantId: ids.tenantA, type: "ANNULATION_RETOUR_AGRICULTEUR" } })).toBe(2);
        expect((await prisma.stockCaisseClient.findUniqueOrThrow({ where: { tenantId_clientId_typeCaisseId: { tenantId: ids.tenantA, clientId: ids.clientA, typeCaisseId: ids.typeA } } })).quantite).toBe(315);
        expect((await prisma.stockCaisseWakala.findUniqueOrThrow({ where: { tenantId_typeCaisseId: { tenantId: ids.tenantA, typeCaisseId: ids.typeA } } })).quantite).toBe(345);
    }, 60_000);

    integrationTest("une annulation consommée échoue entièrement et l’isolation tenant est stricte", async () => {
        const reception = await createReception(200, "consumed");
        await transaction((tx) => appliquerSortiesCaisses(tx, {
            tenantId: ids.tenantA,
            userId: ids.user,
            sources: [{ proprietaire: "CLIENT", clientProprietaireId: ids.clientA, typeCaisseId: ids.typeA, quantite: 400 }],
            type: "SORTIE_VENTE",
        }));
        const before = await prisma.stockCaisseClient.findUniqueOrThrow({ where: { tenantId_clientId_typeCaisseId: { tenantId: ids.tenantA, clientId: ids.clientA, typeCaisseId: ids.typeA } } });
        await expect(transaction(async (tx) => {
            await decrementerStockProprietaire(tx, ids.tenantA, {
                proprietaire: "CLIENT",
                clientProprietaireId: ids.clientA,
                typeCaisseId: ids.typeA,
                quantite: 200,
            });
            await tx.receptionCaisses.update({ where: { id: reception.id }, data: { statut: "ANNULEE" } });
        })).rejects.toThrow("Stock de caisses insuffisant");
        expect((await prisma.stockCaisseClient.findUniqueOrThrow({ where: { tenantId_clientId_typeCaisseId: { tenantId: ids.tenantA, clientId: ids.clientA, typeCaisseId: ids.typeA } } })).quantite).toBe(before.quantite);
        expect((await prisma.receptionCaisses.findUniqueOrThrow({ where: { id: reception.id } })).statut).toBe("VALIDEE");

        await expect(transaction((tx) => appliquerSortiesCaisses(tx, {
            tenantId: ids.tenantA,
            userId: ids.user,
            sources: [{ proprietaire: "CLIENT", clientProprietaireId: ids.clientB, typeCaisseId: ids.typeA, quantite: 1 }],
            type: "SORTIE_VENTE",
        }))).rejects.toThrow("Client introuvable dans cette Wakala");
        expect(await prisma.stockCaisseClient.count({ where: { tenantId: ids.tenantB } })).toBe(0);
    }, 30_000);

    integrationTest("deux débits concurrents ne rendent jamais le stock négatif", async () => {
        await prisma.stockCaisseWakala.create({
            data: { tenantId: ids.tenantA, typeCaisseId: ids.concurrentType, quantite: 50 },
        });
        const debit = (quantite: number) => transaction((tx) => decrementerStockProprietaire(tx, ids.tenantA, {
            proprietaire: "WAKALA",
            typeCaisseId: ids.concurrentType,
            quantite,
        }));
        const results = await Promise.allSettled([debit(40), debit(30)]);
        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
        const stock = await prisma.stockCaisseWakala.findUniqueOrThrow({
            where: { tenantId_typeCaisseId: { tenantId: ids.tenantA, typeCaisseId: ids.concurrentType } },
        });
        expect([10, 20]).toContain(stock.quantite);
        expect(stock.quantite).toBeGreaterThanOrEqual(0);
    }, 30_000);
});
