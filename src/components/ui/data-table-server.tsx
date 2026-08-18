"use client";

import * as React from "react";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
    type VisibilityState,
} from "@tanstack/react-table";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { useTableQueryState, usePrefetchNextPage } from "@/hooks/useTableQueryState";
import type { PaginatedResult } from "@/lib/pagination";

interface DataTableServerProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    result: PaginatedResult<TData>;
    /**
     * Clés de tri exposées, par identifiant de colonne. Une colonne absente de
     * cette table n'est pas cliquable : le serveur refuserait de toute façon
     * une clé qu'il ne connaît pas.
     */
    sortableColumns?: Record<string, string>;
    searchPlaceholder?: string;
    /** Barre d'actions propre au module (exports, filtres…). */
    toolbar?: React.ReactNode;
}

/**
 * Table dont la pagination, le tri et la recherche sont effectués par la base
 * de données, l'état vivant dans l'URL.
 *
 * À la différence de `DataTableAdvanced`, elle ne reçoit qu'une page de lignes
 * et ne trie ni ne filtre localement — sans quoi elle réordonnerait les dix
 * lignes visibles en laissant croire que tout le jeu de données a été trié.
 */
export function DataTableServer<TData, TValue>({
    columns,
    result,
    sortableColumns = {},
    searchPlaceholder,
    toolbar,
}: DataTableServerProps<TData, TValue>) {
    const { t } = useClientTranslations();
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const {
        pageSize,
        sortBy,
        sortDir,
        searchDraft,
        setSearchDraft,
        toggleSort,
        goToPage,
        setPageSize,
        isPending,
    } = useTableQueryState();

    usePrefetchNextPage(result.hasNextPage, result.currentPage);

    const table = useReactTable({
        data: result.items,
        columns,
        state: { columnVisibility },
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        // La base a déjà paginé et trié : les modèles correspondants de
        // TanStack sont volontairement absents.
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        pageCount: result.totalPages,
    });

    return (
        <div className="min-w-0 space-y-4">
            {/* Barre d'outils */}
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <Input
                    placeholder={searchPlaceholder || t("common.search")}
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    className="h-10 w-full rounded-xl border-border bg-background/80 focus:border-[#C17A2B] focus:ring-[#C17A2B] sm:max-w-sm"
                />

                <div className="flex flex-wrap items-center gap-2 sm:ms-auto">
                    {toolbar}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-md border-border">
                                <Settings2 className="mr-2 h-4 w-4" />
                                {t("common.columns")}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-50">
                            {table
                                .getAllColumns()
                                .filter((c) => typeof c.accessorFn !== "undefined" && c.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(v) => column.toggleVisibility(!!v)}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tableau. Atténué pendant le chargement plutôt que remplacé par un
                squelette : les lignes précédentes restent lisibles et la hauteur
                ne saute pas. */}
            <div
                className={cn(
                    "max-w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-sm transition-opacity",
                    isPending && "pointer-events-none opacity-60"
                )}
                aria-busy={isPending}
            >
                <Table className="min-w-max">
                        <TableHeader className="bg-muted/70">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const cle = sortableColumns[header.column.id];
                                    const actif = cle !== undefined && cle === sortBy;
                                    const contenu = header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext());

                                    return (
                                    <TableHead key={header.id} className="font-semibold text-foreground">
                                            {cle === undefined ? (
                                                contenu
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSort(cle)}
                                                    className="-mx-2 flex items-center gap-1.5 rounded-sm px-2 py-1 transition-colors hover:text-[#C17A2B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C17A2B]"
                                                    aria-label={`${t("common.sortBy")} ${header.column.id}`}
                                                >
                                                    {contenu}
                                                    {!actif && <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                                                    {actif && sortDir === "asc" && <ArrowUp className="h-3.5 w-3.5" />}
                                                    {actif && sortDir === "desc" && <ArrowDown className="h-3.5 w-3.5" />}
                                                </button>
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    {t("common.noResults")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-2">
                <div className="text-sm text-muted-foreground sm:flex-1">
                    {result.totalItems === 0
                        ? t("common.noResults")
                        : t("common.rangeOfTotal", {
                            start: String(result.startIndex),
                            end: String(result.endIndex),
                            total: String(result.totalItems),
                        })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end lg:gap-6">
                    <div className="hidden items-center gap-2 sm:flex">
                    <p className="text-sm font-medium text-foreground">{t("common.rowsPerPage")}</p>
                        <Select value={`${pageSize}`} onValueChange={(v) => setPageSize(Number(v))}>
                            <SelectTrigger className="h-8 w-17.5 rounded-sm border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 50, 100].map((taille) => (
                                    <SelectItem key={taille} value={`${taille}`}>
                                        {taille}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                <div className="flex min-w-24 items-center justify-center text-sm font-medium text-foreground">
                        {t("common.page")} {result.currentPage} {t("common.of")} {result.totalPages}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 rounded-md border-border p-0 lg:flex"
                            onClick={() => goToPage(1)}
                            disabled={!result.hasPreviousPage}
                        >
                            <span className="sr-only">{t("common.firstPage")}</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 rounded-md border-border p-0"
                            onClick={() => goToPage(result.currentPage - 1)}
                            disabled={!result.hasPreviousPage}
                        >
                            <span className="sr-only">{t("common.previous")}</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 rounded-md border-border p-0"
                            onClick={() => goToPage(result.currentPage + 1)}
                            disabled={!result.hasNextPage}
                        >
                            <span className="sr-only">{t("common.next")}</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 rounded-md border-border p-0 lg:flex"
                            onClick={() => goToPage(result.totalPages)}
                            disabled={!result.hasNextPage}
                        >
                            <span className="sr-only">{t("common.lastPage")}</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
