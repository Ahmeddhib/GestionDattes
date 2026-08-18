import type { PeriodeBilan } from "@/services/finance.service";

/** Période du dashboard = périodes du Bilan Financier + "semaine". */
export type PeriodeDashboard = PeriodeBilan;

export interface DashboardFiltersValue {
    periode: PeriodeDashboard;
    saisonId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface Evolution {
    value: string;
    isPositive: boolean;
    isNew: boolean;
}

export interface KpiDatum {
    code: string;
    label: string;
    value: number;
    unit: "TND" | "kg" | "nombre";
    evolution?: Evolution;
    comparisonLabel?: string;
    comparisonKey?: string;
    href: string;
}

export interface TrendPoint {
    periode: string;
    [serie: string]: string | number;
}

export type AlertSeverity = "info" | "warning" | "danger";

export interface AlertItem {
    code: string;
    severity: AlertSeverity;
    message: string;
    href?: string;
}

export interface RecentActivityItem {
    id: string;
    label: string;
    sousLabel?: string;
    montant?: number;
    date: Date;
    href: string;
}

export interface RecentActivitySection {
    code: string;
    title: string;
    href: string;
    unit: "TND" | "kg";
    items: RecentActivityItem[];
}

export interface StockParTypeDatum {
    typeDateId: string;
    nom: string;
    quantiteDisponible: number;
    seuilAlerte: number | null;
}

export interface TopAgriculteurDatum {
    agriculteurId: string;
    nom: string;
    quantiteLivree: number;
    nombreLivraisons: number;
}
