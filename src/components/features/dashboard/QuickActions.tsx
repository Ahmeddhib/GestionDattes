import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { Plus, ShoppingCart, Wallet, Receipt, Package, PiggyBank, HandCoins } from "lucide-react";

export interface QuickActionsPermissions {
    canLivraison: boolean;
    canVente: boolean;
    canPaiementAgriculteur: boolean;
    canEncaissementClient: boolean;
    canDepense: boolean;
    canStock: boolean;
    canFinance: boolean;
}

export async function QuickActions({ permissions }: { permissions: QuickActionsPermissions }) {
    const t = await getServerTranslations();
    const actions = [
        {
            show: permissions.canLivraison,
            href: ROUTES.LIVRAISONS,
            label: t("dashboard.quickActions.nouvelleLivraison"),
            icon: Plus,
        },
        {
            show: permissions.canVente,
            href: ROUTES.VENTES,
            label: t("dashboard.quickActions.nouvelleVente"),
            icon: ShoppingCart,
        },
        {
            show: permissions.canPaiementAgriculteur,
            href: ROUTES.PAIEMENTS_AGRICULTEURS,
            label: t("dashboard.quickActions.avanceAgriculteur"),
            icon: HandCoins,
        },
        {
            show: permissions.canEncaissementClient,
            href: ROUTES.VENTES,
            label: t("dashboard.quickActions.encaissementClient"),
            icon: Wallet,
        },
        {
            show: permissions.canDepense,
            href: ROUTES.DEPENSES_AUTRES,
            label: t("dashboard.quickActions.ajouterDepense"),
            icon: Receipt,
        },
        {
            show: permissions.canStock,
            href: ROUTES.STOCK_DATTES,
            label: t("dashboard.quickActions.consulterStock"),
            icon: Package,
        },
        {
            show: permissions.canFinance,
            href: ROUTES.FINANCE,
            label: t("dashboard.quickActions.bilanFinancier"),
            icon: PiggyBank,
        },
    ].filter((a) => a.show);

    if (actions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
                <Button
                    key={action.label}
                    asChild
                    variant="outline"
                    className="gap-2 rounded-md border-[#C17A2B]/30 text-[#3D1C00] hover:bg-[#FAF0DC] dark:text-[#F5E6C8] dark:hover:bg-[#3D1C00]"
                >
                    <Link href={action.href}>
                        <action.icon className="h-4 w-4" />
                        {action.label}
                    </Link>
                </Button>
            ))}
        </div>
    );
}
