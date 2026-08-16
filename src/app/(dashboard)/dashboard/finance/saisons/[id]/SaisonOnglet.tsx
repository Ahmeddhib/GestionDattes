import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getServerTranslations } from "@/i18n/server";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { getTenantPdfBranding } from "@/lib/pdf-branding.server";
import type { OngletSaison } from "@/lib/saison-onglets";

import { getLivraisonsAction } from "@/actions/livraisons/get-livraisons.action";
import { getVentesAction } from "@/actions/ventes/get-ventes.action";
import { getDepensesAction } from "@/actions/depenses/get-depenses.action";
import { getPretsAction } from "@/actions/prets-caisses/get-prets.action";
import { getBonsAchatAvecSoldeAction } from "@/actions/paiements-agriculteurs/get-bons-achat-avec-solde.action";
import { getEncaissementsAction } from "@/actions/encaissements-clients/get-encaissements.action";
import { getAuditLogsAction } from "@/actions/audit/get-audit-logs.action";
import { peseeService } from "@/services/pesee.service";
import { bonAchatService } from "@/services/bon-achat.service";
import { stockDateService } from "@/services/stock-date.service";
import { auth } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { findSaisonOuverte } from "@/lib/saison-guard";

import { LivraisonsTableAdvanced } from "@/components/features/livraisons/LivraisonsTableAdvanced";
import { PeseesTableAdvanced } from "@/components/features/pesees/PeseesTableAdvanced";
import { BonsAchatTableAdvanced } from "@/components/features/bons-achat/BonsAchatTableAdvanced";
import { VentesTableAdvanced } from "@/components/features/ventes/VentesTableAdvanced";
import { PaiementsAgriculteursTableAdvanced } from "@/components/features/paiements-agriculteurs/PaiementsAgriculteursTableAdvanced";
import { DepensesTableAdvanced } from "@/components/features/depenses/DepensesTableAdvanced";
import { StockDattesTableAdvanced } from "@/components/features/stock-dattes/StockDattesTableAdvanced";
import { PretsTable } from "@/components/features/stock-caisses/PretsTable";
import { EncaissementsTable } from "@/components/features/encaissements/EncaissementsTable";
import { SaisonAuditTable } from "./SaisonAuditTable";

/**
 * Contenu de l'onglet actif du détail d'une saison.
 *
 * Toutes les requêtes sont bornées par `tenantId + saisonId` — jamais par des
 * dates. Le `saisonId` vient du paramètre de route, jamais de la query string :
 * on ne peut donc pas afficher une saison en manipulant l'URL de filtrage.
 *
 * Chaque branche réutilise la table du module correspondant plutôt que d'en
 * redéfinir une : les colonnes, les exports et les actions restent identiques
 * à ceux de la page de liste.
 */
export async function SaisonOnglet({
    onglet,
    saisonId,
}: {
    onglet: Exclude<OngletSaison, "apercu">;
    saisonId: string;
}) {
    const t = await getServerTranslations();
    const tenantId = await getTenantId();

    switch (onglet) {
        case "livraisons": {
            const session = await auth();
            const result = await getLivraisonsAction({ saisonId });
            return (
                <Panneau>
                    <LivraisonsTableAdvanced
                        livraisons={result.success ? result.data || [] : []}
                        canEditAcceptedQuantity={
                            session?.user.role === ROLES.ADMIN ||
                            session?.user.role === ROLES.DIRECTION
                        }
                    />
                </Panneau>
            );
        }

        case "pesees": {
            const session = await auth();
            // `peseeService` filtre via la relation Livraison : une pesée
            // appartient à la saison de sa livraison, elle n'a pas de saison
            // propre.
            const pesees = await peseeService.getAll(tenantId, session!.user.id, { saisonId });
            return (
                <Panneau>
                    <PeseesTableAdvanced data={pesees} />
                </Panneau>
            );
        }

        case "bons-achat": {
            const [bonsAchat, tenant] = await Promise.all([
                bonAchatService.getAll(tenantId, { saisonId }),
                bonAchatService.getTenantInfo(tenantId),
            ]);
            return (
                <Panneau>
                    <BonsAchatTableAdvanced data={bonsAchat} tenant={tenant} />
                </Panneau>
            );
        }

        case "ventes": {
            // `saisonOuverte` et non la saison consultée : un encaissement saisi
            // depuis cet onglet est rattaché à la campagne où l'argent circule,
            // même si l'on consulte une campagne clôturée.
            const [result, branding, saisonOuverte] = await Promise.all([
                getVentesAction({ saisonId }),
                getTenantPdfBranding(tenantId),
                findSaisonOuverte(tenantId),
            ]);
            return (
                <Panneau>
                    <VentesTableAdvanced
                        data={result.success ? result.data || [] : []}
                        branding={branding}
                        saisonActive={saisonOuverte ?? undefined}
                    />
                </Panneau>
            );
        }

        case "paiements": {
            const [result, branding, saisonOuverte] = await Promise.all([
                getBonsAchatAvecSoldeAction({ saisonId }),
                getTenantPdfBranding(tenantId),
                findSaisonOuverte(tenantId),
            ]);
            return (
                <Panneau>
                    <PaiementsAgriculteursTableAdvanced
                        data={result.success ? result.data || [] : []}
                        branding={branding}
                        saisonActive={saisonOuverte ?? undefined}
                    />
                </Panneau>
            );
        }

        case "encaissements": {
            const result = await getEncaissementsAction({ saisonId });
            return (
                <Panneau>
                    <EncaissementsTable
                        encaissements={result.success ? result.data || [] : []}
                    />
                </Panneau>
            );
        }

        case "depenses": {
            const [result, branding] = await Promise.all([
                getDepensesAction({ saisonId }),
                getTenantPdfBranding(tenantId),
            ]);
            return (
                <Panneau>
                    <DepensesTableAdvanced
                        data={result.success ? result.data || [] : []}
                        branding={branding}
                    />
                </Panneau>
            );
        }

        case "stock": {
            // Lots ENTRÉS pendant cette saison (`saisonOrigineId`). Un lot
            // vendu pendant une campagne ultérieure reste listé ici : c'est son
            // origine, pas sa disponibilité, qui définit son appartenance.
            const stockDates = await stockDateService.getAll(tenantId, { saisonId });
            return (
                <Panneau note={t("finance.saisons.detail.stockNote")}>
                    <StockDattesTableAdvanced data={stockDates} />
                </Panneau>
            );
        }

        case "caisses": {
            const [result, branding] = await Promise.all([
                getPretsAction({ saisonId }),
                getTenantPdfBranding(tenantId),
            ]);
            return (
                <Panneau note={t("finance.saisons.detail.caissesNote")}>
                    <PretsTable
                        prets={result.success ? result.data || [] : []}
                        branding={branding}
                    />
                </Panneau>
            );
        }

        case "audit": {
            const result = await getAuditLogsAction({ targetId: saisonId, pageSize: 100 });
            const logs = (result.data?.data ?? []).map((log) => ({
                id: log.id,
                action: log.action,
                description: log.description,
                createdAt: format(new Date(log.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr }),
                auteur: log.actor?.name || log.actor?.email || "—",
            }));
            return (
                <Panneau>
                    <SaisonAuditTable logs={logs} />
                </Panneau>
            );
        }
    }
}

function Panneau({ children, note }: { children: React.ReactNode; note?: string }) {
    return (
        <div className="space-y-3">
            {note && <p className="text-sm text-gray-600">{note}</p>}
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                {children}
            </div>
        </div>
    );
}
