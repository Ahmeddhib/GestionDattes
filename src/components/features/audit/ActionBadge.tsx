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
};

interface ActionBadgeProps {
    action: string;
}

export function ActionBadge({ action }: ActionBadgeProps) {
    const config = ACTION_CONFIG[action] || { label: action, variant: "default" as const };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
