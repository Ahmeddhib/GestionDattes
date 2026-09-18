import { describe, expect, test } from "bun:test";
import type { Prisma } from "@/generated/prisma";
import { decrementerStockProprietaire, incrementerStockProprietaire } from "@/repositories/caisse-stock.repository";
import {
    adjustWakalaStockSchema,
    caisseSourceLineSchema,
    createReceptionCaissesSchema,
} from "@/validators/caisse-stock.validator";
import { createPretCaisseSchema } from "@/validators/pret-caisse.validator";
import { createVenteSchema } from "@/validators/vente.validator";
import { repartirRetoursFifo } from "@/lib/caisse-stock-domain";
import { pretCaisseRepository } from "@/repositories/pret-caisse.repository";

describe("validation du stock de caisses", () => {
    test("accepte une source Wakala sans propriétaire client", () => {
        expect(caisseSourceLineSchema.parse({
            proprietaire: "WAKALA",
            typeCaisseId: "type-1",
            quantite: 4,
        })).toEqual({
            proprietaire: "WAKALA",
            typeCaisseId: "type-1",
            quantite: 4,
        });
    });

    test("refuse une source client sans client propriétaire", () => {
        expect(() => caisseSourceLineSchema.parse({
            proprietaire: "CLIENT",
            typeCaisseId: "type-1",
            quantite: 1,
        })).toThrow();
    });

    test("refuse deux lignes de réception pour le même type", () => {
        expect(() => createReceptionCaissesSchema.parse({
            clientId: "client-1",
            date: "2026-09-09",
            lignes: [
                { typeCaisseId: "type-1", quantite: 2 },
                { typeCaisseId: "type-1", quantite: 3 },
            ],
        })).toThrow("Un type de caisse ne peut apparaître qu'une fois");
    });

    test("valide un ajustement absolu du stock Wakala avec un motif", () => {
        expect(adjustWakalaStockSchema.parse({
            typeCaisseId: "type-1",
            nouvelleQuantite: "125",
            motif: "Inventaire physique",
        })).toEqual({
            typeCaisseId: "type-1",
            nouvelleQuantite: 125,
            motif: "Inventaire physique",
        });
    });

    test("refuse un ajustement Wakala négatif ou sans motif", () => {
        expect(() => adjustWakalaStockSchema.parse({
            typeCaisseId: "type-1",
            nouvelleQuantite: -1,
            motif: "",
        })).toThrow();
    });

    test("accepte un prêt réparti entre Wakala et client", () => {
        const pret = createPretCaisseSchema.parse({
            agriculteurId: "agri-1",
            typeCaisseId: "type-1",
            nombrePrete: 40,
            sources: [
                { proprietaire: "WAKALA", quantite: 25 },
                { proprietaire: "CLIENT", clientProprietaireId: "client-1", quantite: 15 },
            ],
        });
        expect(pret.sources.map((source) => source.quantite)).toEqual([25, 15]);
    });

    test("refuse un prêt dont les sources ne couvrent pas le total", () => {
        expect(() => createPretCaisseSchema.parse({
            agriculteurId: "agri-1",
            typeCaisseId: "type-1",
            nombrePrete: 40,
            sources: [{ proprietaire: "WAKALA", quantite: 25 }],
        })).toThrow("La somme des sources doit être égale");
    });

    test("refuse une vente qui consomme les caisses d'un autre client", () => {
        expect(() => createVenteSchema.parse({
            clientId: "client-1",
            stockId: "stock-date-1",
            quantite: 100,
            prixUnitaire: 4.2,
            caisses: [{
                proprietaire: "CLIENT",
                clientProprietaireId: "client-2",
                typeCaisseId: "type-1",
                quantite: 10,
            }],
        })).toThrow("Les caisses client doivent appartenir au client de la vente");
    });
});

describe("débit atomique du stock de caisses", () => {
    test("protège le stock Wakala avec la condition quantite >= débit", async () => {
        let appel: unknown;
        const tx = {
            stockCaisseWakala: {
                updateMany: async (args: unknown) => {
                    appel = args;
                    return { count: 1 };
                },
            },
        } as unknown as Prisma.TransactionClient;

        await decrementerStockProprietaire(tx, "tenant-1", {
            proprietaire: "WAKALA",
            typeCaisseId: "type-1",
            quantite: 7,
        });

        expect(appel).toEqual({
            where: {
                tenantId: "tenant-1",
                typeCaisseId: "type-1",
                quantite: { gte: 7 },
            },
            data: { quantite: { decrement: 7 } },
        });
    });

    test("refuse le débit client si aucun stock suffisant n'a été modifié", async () => {
        const tx = {
            stockCaisseClient: { updateMany: async () => ({ count: 0 }) },
        } as unknown as Prisma.TransactionClient;

        await expect(decrementerStockProprietaire(tx, "tenant-1", {
            proprietaire: "CLIENT",
            clientProprietaireId: "client-1",
            typeCaisseId: "type-1",
            quantite: 12,
        })).rejects.toThrow("Stock de caisses insuffisant");
    });

    test("isole le débit client par tenant, propriétaire et type", async () => {
        let appel: { where?: unknown } | undefined;
        const tx = {
            stockCaisseClient: {
                updateMany: async (args: { where?: unknown }) => {
                    appel = args;
                    return { count: 1 };
                },
            },
        } as unknown as Prisma.TransactionClient;

        await decrementerStockProprietaire(tx, "tenant-a", {
            proprietaire: "CLIENT",
            clientProprietaireId: "ahmed-a",
            typeCaisseId: "gc-a",
            quantite: 40,
        });

        expect(appel?.where).toEqual({
            tenantId: "tenant-a",
            clientId: "ahmed-a",
            typeCaisseId: "gc-a",
            quantite: { gte: 40 },
        });
    });

    test("une réception client crédite uniquement son compte propriétaire", async () => {
        let appel: unknown;
        const tx = {
            stockCaisseClient: {
                upsert: async (args: unknown) => {
                    appel = args;
                    return { quantite: 200 };
                },
            },
        } as unknown as Prisma.TransactionClient;

        await incrementerStockProprietaire(tx, "tenant-a", {
            proprietaire: "CLIENT",
            clientProprietaireId: "ahmed-a",
            typeCaisseId: "gc-a",
            quantite: 200,
        });

        expect(appel).toEqual({
            where: { tenantId_clientId_typeCaisseId: { tenantId: "tenant-a", clientId: "ahmed-a", typeCaisseId: "gc-a" } },
            create: { tenantId: "tenant-a", clientId: "ahmed-a", typeCaisseId: "gc-a", quantite: 200 },
            update: { quantite: { increment: 200 } },
        });
    });
});

describe("retour des prêts", () => {
    test("répartit le retour en FIFO sur plusieurs prêts", () => {
        expect(repartirRetoursFifo([
            { id: "ancien", nombrePrete: 30, nombreRetourne: 10 },
            { id: "recent", nombrePrete: 40, nombreRetourne: 5 },
        ], 45)).toEqual({
            allocations: [
                { pretId: "ancien", quantite: 20 },
                { pretId: "recent", quantite: 25 },
            ],
            totalRetourne: 45,
            sansPret: 0,
        });
    });

    test("détecte un retour concurrent sur le même prêt", async () => {
        const pret = {
            id: "pret-1",
            tenantId: "tenant-a",
            nombrePrete: 50,
            nombreRetourne: 10,
            statut: "EN_COURS",
            observations: null,
        };
        const tx = {
            pretCaisse: {
                findFirst: async () => pret,
                updateMany: async () => ({ count: 0 }),
            },
        } as unknown as Prisma.TransactionClient;

        await expect(pretCaisseRepository.retournerCaisses(
            "pret-1", 20, "tenant-a", undefined, tx
        )).rejects.toThrow("modifié simultanément");
    });
});
