"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    CREATE_USER:     { label: "Création",        color: "bg-green-100 text-green-800" },
    UPDATE_USER:     { label: "Modification",    color: "bg-blue-100 text-blue-800" },
    ACTIVATE_USER:   { label: "Activation",      color: "bg-teal-100 text-teal-800" },
    DEACTIVATE_USER: { label: "Désactivation",   color: "bg-orange-100 text-orange-800" },
    CHANGE_ROLE:     { label: "Changement rôle", color: "bg-purple-100 text-purple-800" },
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
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Journal d'Audit</h1>
                <p className="text-gray-500 mt-1">Historique de toutes les actions effectuées dans le système</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {Object.entries(ACTION_LABELS).map(([key, val]) => {
                    const count = initialLogs.filter((l) => l.action === key).length;
                    return (
                        <div
                            key={key}
                            onClick={() => setFilter(filter === key ? "ALL" : key)}
                            className={`rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${filter === key ? "ring-2 ring-indigo-400" : ""}`}
                        >
                            <p className="text-xs text-gray-500">{val.label}</p>
                            <p className="text-2xl font-bold mt-1">{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Search */}
            <div className="flex gap-4 mb-4">
                <Input
                    placeholder="Rechercher par utilisateur ou description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-md"
                />
                {filter !== "ALL" && (
                    <button
                        onClick={() => setFilter("ALL")}
                        className="text-sm text-indigo-600 hover:underline"
                    >
                        Réinitialiser le filtre
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date & Heure</TableHead>
                            <TableHead>Acteur</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-400 py-12">
                                    Aucun log trouvé
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((log) => {
                                const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-gray-100 text-gray-800" };
                                const date = new Date(log.createdAt);
                                return (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                            {date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                            {" "}
                                            <span className="text-gray-400">{date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium text-sm">{log.actor.name}</p>
                                            <p className="text-xs text-gray-400">{log.actor.email}</p>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                                                {meta.label}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {log.description || "—"}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                <div className="px-4 py-3 border-t text-sm text-gray-400">
                    {filtered.length} résultat{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
                </div>
            </div>
        </div>
    );
}
