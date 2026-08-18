import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
// Les requetes Prisma ordinaires passent par HTTPS. C'est plus robuste sur
// les reseaux qui filtrent `wss://*.neon.tech`; les transactions continuent
// a utiliser WebSocket lorsque Prisma en a reellement besoin.
neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    prismaSchemaVersion: string | undefined;
};

// Increment this value whenever the generated Prisma client gains a new model.
// It prevents Next.js development hot reload from reusing a client created with
// an older schema (whose delegates would otherwise be undefined).
const PRISMA_SCHEMA_VERSION = "20260816190000";

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;

    // Durant le build Vercel, DATABASE_URL peut ne pas être disponible
    // On crée un client Prisma sans adapter pour permettre le build
    if (!connectionString) {
        console.warn("⚠️ DATABASE_URL not found - creating Prisma client without adapter (build mode)");

        return new PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        });
    }

    console.log("✅ Creating Prisma client with Neon adapter...");

    const adapter = new PrismaNeon({
        connectionString,
        connectionTimeoutMillis: 15000,
    });

    // PRISMA_QUERY_COUNT=1 : instrumentation temporaire de diagnostic. Compte
    // les requêtes et le temps cumulé, pour distinguer « une requête lente »
    // de « beaucoup d'allers-retours » — la base étant en us-east-1, chaque
    // aller-retour coûte ~150 ms depuis la Tunisie.
    const compteRequetes = process.env.PRISMA_QUERY_COUNT === "1";

    const client = new PrismaClient({
        adapter,
        // Le défaut de Prisma est de 5 s, calibré pour une base voisine. Chaque
        // requête d'une transaction interactive est un aller-retour réseau : dès
        // que la latence monte (poste de développement hors de la région de la
        // base), une transaction parfaitement normale expire en P2028 — la
        // création d'un prêt de caisses échouait ainsi à 7,5 s. On relève le
        // plafond au lieu de le contourner transaction par transaction.
        transactionOptions: { timeout: 20000, maxWait: 10000 },
        log: compteRequetes
            ? [{ emit: "event", level: "query" }, "error", "warn"]
            : process.env.NODE_ENV === "development"
                ? ["error", "warn"]
                : ["error"],
    });

    if (compteRequetes) {
        let nb = 0;
        let cumul = 0;
        let dernier = Date.now();
        (client as unknown as {
            $on: (e: "query", cb: (ev: { query: string; duration: number }) => void) => void;
        }).$on("query", (ev) => {
            // Plus de 2 s sans requête ⇒ nouvelle opération : on repart de zéro.
            if (Date.now() - dernier > 2000) { nb = 0; cumul = 0; }
            dernier = Date.now();
            nb += 1;
            cumul += ev.duration;
            console.log(
                `[SQL ${String(nb).padStart(3)}] ${ev.duration}ms (cumul ${cumul}ms) ${ev.query.slice(0, 90)}`
            );
        });
    }

    // Vérification en dev que le modèle Role existe
    if (process.env.NODE_ENV === "development") {
        if (!client.role) {
            console.error("❌ ERREUR: Le modèle Role n'existe pas dans le client Prisma!");
            console.error("Veuillez exécuter: bunx prisma generate");
        } else {
            console.log("✅ Modèle Role chargé correctement");
        }
    }

    return client;
}

const hasCurrentPrismaClient =
    globalForPrisma.prisma !== undefined &&
    globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION;

export const prisma = hasCurrentPrismaClient
    ? globalForPrisma.prisma!
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}
