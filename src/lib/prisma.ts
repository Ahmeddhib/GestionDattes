import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    prismaSchemaVersion: string | undefined;
};

// Increment this value whenever the generated Prisma client gains a new model.
// It prevents Next.js development hot reload from reusing a client created with
// an older schema (whose delegates would otherwise be undefined).
const PRISMA_SCHEMA_VERSION = "20260722063107";

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

    const adapter = new PrismaNeon({ connectionString });

    const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

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
