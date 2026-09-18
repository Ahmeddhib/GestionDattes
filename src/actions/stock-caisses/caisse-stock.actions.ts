"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { resolveActionErrorMessage } from "@/lib/action-error";
import { caisseStockService } from "@/services/caisse-stock.service";
import {
    adjustWakalaStockSchema,
    cancelReceptionCaissesSchema,
    createReceptionCaissesSchema,
} from "@/validators/caisse-stock.validator";

async function contexte() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Non authentifié");
    return { tenantId: await getTenantId(), userId: session.user.id };
}

export async function createReceptionCaissesAction(input: unknown) {
    try {
        const parsed = createReceptionCaissesSchema.parse(input);
        const ctx = await contexte();
        const data = await caisseStockService.creerReception(ctx.tenantId, ctx.userId, parsed);
        revalidatePath("/dashboard/stock-caisses");
        return { success: true as const, data };
    } catch (error) {
        return { success: false as const, error: await resolveActionErrorMessage(error) };
    }
}

export async function cancelReceptionCaissesAction(input: unknown) {
    try {
        const parsed = cancelReceptionCaissesSchema.parse(input);
        const ctx = await contexte();
        const data = await caisseStockService.annulerReception(ctx.tenantId, ctx.userId, parsed);
        revalidatePath("/dashboard/stock-caisses");
        return { success: true as const, data };
    } catch (error) {
        return { success: false as const, error: await resolveActionErrorMessage(error) };
    }
}

export async function adjustWakalaStockAction(input: unknown) {
    try {
        const parsed = adjustWakalaStockSchema.parse(input);
        const ctx = await contexte();
        const data = await caisseStockService.ajusterStock(ctx.tenantId, ctx.userId, {
            proprietaire: "WAKALA",
            typeCaisseId: parsed.typeCaisseId,
            nouvelleQuantite: parsed.nouvelleQuantite,
            motif: parsed.motif,
        });
        revalidatePath("/dashboard/stock-caisses");
        return { success: true as const, data };
    } catch (error) {
        return { success: false as const, error: await resolveActionErrorMessage(error) };
    }
}

export async function getCaisseStockOverviewAction() {
    try {
        const ctx = await contexte();
        return { success: true as const, data: await caisseStockService.getVueGlobale(ctx.tenantId, ctx.userId) };
    } catch (error) {
        return { success: false as const, error: await resolveActionErrorMessage(error) };
    }
}

export async function getReceptionsCaissesPageAction(params: Parameters<typeof caisseStockService.getReceptionsPage>[2]) {
    try {
        const ctx = await contexte();
        return { success: true as const, data: await caisseStockService.getReceptionsPage(ctx.tenantId, ctx.userId, params) };
    } catch (error) {
        return { success: false as const, error: await resolveActionErrorMessage(error) };
    }
}

export async function getStocksClientsPageAction(params: Parameters<typeof caisseStockService.getStocksClientsPage>[2]) {
    try {
        const ctx = await contexte();
        return { success: true as const, data: await caisseStockService.getStocksClientsPage(ctx.tenantId, ctx.userId, params) };
    } catch (error) {
        return { success: false as const, error: await resolveActionErrorMessage(error) };
    }
}

export async function getMouvementsCaissesPageAction(params: Parameters<typeof caisseStockService.getMouvementsPage>[2]) {
    try {
        const ctx = await contexte();
        return { success: true as const, data: await caisseStockService.getMouvementsPage(ctx.tenantId, ctx.userId, params) };
    } catch (error) {
        return { success: false as const, error: await resolveActionErrorMessage(error) };
    }
}
