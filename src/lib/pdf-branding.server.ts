import "server-only";

import { prisma } from "@/lib/prisma";
import type { PdfBranding } from "@/lib/pdf-branding";

export async function getTenantPdfBranding(tenantId: string): Promise<PdfBranding> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: { name: true, address: true, phone: true, email: true, settings: true },
    });
    const settings = tenant.settings;
    const configuredLogo =
        settings && typeof settings === "object" && !Array.isArray(settings) &&
        "logoUrl" in settings && typeof settings.logoUrl === "string" &&
        settings.logoUrl.startsWith("/")
            ? settings.logoUrl
            : null;

    return {
        name: tenant.name,
        address: tenant.address,
        phone: tenant.phone,
        email: tenant.email,
        logoUrl: configuredLogo ?? "/kayen-logo.jpg",
    };
}
