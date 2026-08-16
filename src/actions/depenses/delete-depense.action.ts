"use server";

import { auth } from "@/lib/auth";
import { resolveActionErrorMessage } from "@/lib/action-error";
import { depenseAutreService } from "@/services/depense-autre.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { revalidatePath } from "next/cache";

export async function deleteDepenseAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        await depenseAutreService.delete(tenantId, session.user.id, id);

        revalidatePath("/dashboard/finance/depenses");

        return { success: true };
    } catch (error) {
        console.error("❌ deleteDepenseAction error:", error);
        return {
            success: false,
            error: await resolveActionErrorMessage(error),
        };
    }
}
