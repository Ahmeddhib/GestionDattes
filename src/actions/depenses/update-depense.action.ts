"use server";

import { auth } from "@/lib/auth";
import { resolveActionErrorMessage } from "@/lib/action-error";
import { depenseAutreService } from "@/services/depense-autre.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { updateDepenseSchema } from "@/validators/depense-autre.validator";
import type { z } from "zod";
import { revalidatePath } from "next/cache";

export async function updateDepenseAction(
    id: string,
    data: Omit<z.input<typeof updateDepenseSchema>, "id">
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const validatedData = updateDepenseSchema.parse({ ...data, id });

        const tenantId = await getTenantId();
        const depense = await depenseAutreService.update(tenantId, session.user.id, validatedData);

        revalidatePath("/dashboard/finance/depenses");

        return { success: true, data: depense };
    } catch (error) {
        console.error("❌ updateDepenseAction error:", error);
        return {
            success: false,
            error: await resolveActionErrorMessage(error),
        };
    }
}
