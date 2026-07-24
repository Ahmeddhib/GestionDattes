CREATE TABLE "Livreur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "cin" TEXT,
    "vehicule" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Livreur_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Livreur_tenantId_cin_key" ON "Livreur"("tenantId", "cin");
CREATE INDEX "Livreur_tenantId_idx" ON "Livreur"("tenantId");
CREATE INDEX "Livreur_nom_idx" ON "Livreur"("nom");

ALTER TABLE "Livreur" ADD CONSTRAINT "Livreur_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
