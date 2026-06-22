import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const sql = neon(process.env.DATABASE_URL!);

        // Create Role table
        await sql`
      CREATE TABLE IF NOT EXISTS "Role" (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT
      );
    `;

        // Create User table
        await sql`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        "roleId" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") 
          REFERENCES "Role"(id) ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `;

        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS "User_roleId_idx" ON "User"("roleId");`;
        await sql`CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);`;

        // Create _prisma_migrations table for Prisma tracking
        await sql`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        id VARCHAR(36) PRIMARY KEY,
        checksum VARCHAR(64) NOT NULL,
        finished_at TIMESTAMPTZ,
        migration_name VARCHAR(255) NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        applied_steps_count INTEGER NOT NULL DEFAULT 0
      );
    `;

        return NextResponse.json({
            success: true,
            message: "Tables créées avec succès!",
        });
    } catch (error: any) {
        console.error("Erreur:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        );
    }
}
