import { Badge } from "@/components/shared/Badge";

const ACTION_CONFIG: Record<
    string,
    { label: string; variant: "default" | "success" | "warning" | "danger" | "secondary" }
> = {
    CREATE_USER: { label: "Création utilisateur", variant: "success" },
    UPDATE_USER: { label: "Modification utilisateur", variant: "warning" },
    ACTIVATE_USER: { label: "Activation utilisateur", variant: "success" },
    DEACTIVATE_USER: { label: "Désactivation utilisateur", variant: "danger" },
    CHANGE_ROLE: { label: "Changement de rôle", variant: "warning" },
    CREATE_ROLE: { label: "Création rôle", variant: "success" },
    UPDATE_ROLE: { label: "Modification rôle", variant: "warning" },
    DELETE_ROLE: { label: "Suppression rôle", variant: "danger" },
    CREATE_SAISON: { label: "Création saison", variant: "success" },
    UPDATE_SAISON: { label: "Modification saison", variant: "warning" },
    DELETE_SAISON: { label: "Suppression saison", variant: "danger" },
    CREATE_PAIEMENT_AGRICULTEUR: { label: "Paiement agriculteur", variant: "success" },
    CREATE_ENCAISSEMENT_CLIENT: { label: "Encaissement client", variant: "success" },
    CREATE_DEPENSE_AUTRE: { label: "Création dépense", variant: "success" },
    UPDATE_DEPENSE_AUTRE: { label: "Modification dépense", variant: "warning" },
    DELETE_DEPENSE_AUTRE: { label: "Suppression dépense", variant: "danger" },
    CREATE_VENTE: { label: "Création vente", variant: "success" },
    UPDATE_VENTE: { label: "Modification vente", variant: "warning" },
};

interface ActionBadgeProps {
    action: string;
}

export function ActionBadge({ action }: ActionBadgeProps) {
    const config = ACTION_CONFIG[action] || { label: action, variant: "default" as const };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
