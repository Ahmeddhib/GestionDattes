"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    CREATE_USER:     { label: "Création",        color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    UPDATE_USER:     { label: "Modification",    color: "bg-blue-100 text-blue-800 border-blue-200" },
    ACTIVATE_USER:   { label: "Activation",      color: "bg-teal-100 text-teal-800 border-teal-200" },
    DEACTIVATE_USER: { label: "Désactivation",   color: "bg-orange-100 text-orange-800 border-orange-200" },
    CHANGE_ROLE:     { label: "Changement rôle", color: "bg-purple-100 text-purple-800 border-purple-200" },
};

type Log = {
    id: string;
    action: string;
    description: string | null;
    createdAt: Date | string;
    targetId: string | null;
    actor: { id: string; name: string; email: string };
};

export default function AuditLogsClient({ initialLogs }: { initialLogs: Log[] }) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");

    const filtered = initialLogs.filter((log) => {
        const matchesSearch =
            log.actor.name.toLowerCase().includes(search.toLowerCase()) ||
            log.actor.email.toLowerCase().includes(search.toLowerCase()) ||
            (log.description || "").toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "ALL" || log.action === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex-1 space-y-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Journal d'Audit</h2>
                    <p className="text-sm text-muted-foreground">
                        Historique complet et traçabilité des actions effectuées sur le système.
                    </p>
                </div>
            </div>

            {/* Stats / Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                {Object.entries(ACTION_LABELS).map(([key, val]) => {
                    const count = initialLogs.filter((l) => l.action === key).length;
                    const isActive = filter === key;
                    return (
                        <div
                            key={key}
                            onClick={() => setFilter(isActive ? "ALL" : key)}
                            className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                                isActive 
                                    ? "border-violet-400 bg-violet-50/50" 
                                    : "bg-card hover:border-violet-200"
                            }`}
                        >
                            <p className="text-sm font-medium text-muted-foreground">{val.label}</p>
                            <p className="text-2xl font-bold mt-1">{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2 py-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filtrer par acteur, email ou description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                {filter !== "ALL" && (
                    <Button
                        variant="outline"
                        onClick={() => setFilter("ALL")}
                        className="text-violet-600 border-violet-200 hover:bg-violet-50"
                    >
                        <FilterX className="mr-2 h-4 w-4" />
                        Effacer le filtre
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Date & Heure</TableHead>
                            <TableHead>Acteur</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Aucun log trouvé. Essayez de modifier vos critères de recherche.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((log) => {
                                const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-slate-100 text-slate-800 border-slate-200" };
                                const date = new Date(log.createdAt);
                                return (
                                    <TableRow key={log.id} className="group hover:bg-muted/50 transition-colors">
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-violet-100 text-violet-700 text-xs font-semibold">
                                                        {log.actor.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.actor.name}</span>
                                                    <span className="text-xs text-muted-foreground">{log.actor.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={meta.color}>
                                                {meta.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                                            {log.description || "—"}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Statistics */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
                <div>
                    {filtered.length} résultat(s) trouvé(s).
                </div>
            </div>
        </div>
    );
}
