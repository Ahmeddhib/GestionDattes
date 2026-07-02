import { NextResponse } from "next/server";

/**
 * ⚠️ ROUTE OBSOLÈTE - NE PAS UTILISER
 * 
 * Cette route crée l'ancienne structure de base de données non multi-tenant.
 * 
 * Pour le système multi-tenant actuel:
 * 1. Utilisez Prisma migrations: bun prisma migrate dev
 * 2. Ou utilisez: bun prisma db push
 * 3. Puis initialisez les données: bun prisma db seed
 */
export async function GET() {
  return NextResponse.json({
    success: false,
    error: "Cette route est obsolète. Utilisez 'bun prisma migrate dev' ou 'bun prisma db push' à la place.",
    help: {
      migration: "bun prisma migrate dev",
      push: "bun prisma db push",
      seed: "bun prisma db seed"
    }
  }, { status: 410 }); // 410 Gone
}
