import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error("❌ DATABASE_URL is not defined!");
        throw new Error("DATABASE_URL is not defined in environment variables");
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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
