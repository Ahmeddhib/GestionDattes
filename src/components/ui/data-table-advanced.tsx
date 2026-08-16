"use client";

import * as React from "react";
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type Row,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    GripVertical,
    Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchPlaceholder?: string;
    enableRowSelection?: boolean;
    enableDragDrop?: boolean;
    onDataChange?: (data: TData[]) => void;
    onSearchChange?: (value: string) => void;
}

// Drag Handle Component
function DragHandle({ id }: { id: string | number }) {
    const { attributes, listeners } = useSortable({ id });
    return (
        <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
            <GripVertical className="h-4 w-4" />
        </div>
    );
}

// Draggable Row Component
function DraggableRow<TData>({
    row,
    enableDragDrop,
}: {
    row: Row<TData>;
    enableDragDrop?: boolean;
}) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition,
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            data-state={row.getIsSelected() && "selected"}
            className={isDragging ? "opacity-50" : ""}
        >
            {enableDragDrop && (
                <TableCell className="w-10">
                    <DragHandle id={row.id} />
                </TableCell>
            )}
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    );
}

export function DataTableAdvanced<TData, TValue>({
    columns,
    data: initialData,
    searchKey,
    searchPlaceholder,
    enableRowSelection = true,
    enableDragDrop = false,
    onDataChange,
    onSearchChange,
}: DataTableProps<TData, TValue>) {
    const { t } = useClientTranslations();
    const [data, setData] = React.useState(initialData);
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [searchValue, setSearchValue] = React.useState("");

    // Sync data with parent
    React.useEffect(() => {
        setData(initialData);
    }, [initialData]);

    // Add selection column if enabled
    const tableColumns = React.useMemo(() => {
        const cols = [...columns];
        if (enableRowSelection) {
            cols.unshift({
                id: "select",
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() && "indeterminate")
                            }
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Tout sélectionner"
                            className="border-border"
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Sélectionner la ligne"
                            className="border-border"
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            } as ColumnDef<TData, TValue>);
        }
        return cols;
    }, [columns, enableRowSelection]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    );

    const dataIds = React.useMemo(
        () => table.getRowModel().rows.map((row) => row.id),
        [table]
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setData((data) => {
                const oldIndex = dataIds.indexOf(active.id as string);
                const newIndex = dataIds.indexOf(over.id as string);
                const newData = arrayMove(data, oldIndex, newIndex);
                onDataChange?.(newData);
                return newData;
            });
        }
    }

    return (
        <div className="min-w-0 space-y-4">
            {/* Toolbar */}
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                {/* Search */}
                {(searchKey || onSearchChange) && (
                    <Input
                        placeholder={searchPlaceholder || t("common.search")}
                        value={searchKey ? (table.getColumn(searchKey)?.getFilterValue() as string) ?? "" : searchValue}
                        onChange={(event) => {
                            const value = event.target.value;
                            setSearchValue(value);
                            if (searchKey) {
                                table.getColumn(searchKey)?.setFilterValue(value);
                            }
                            onSearchChange?.(value);
                        }}
                        className="w-full rounded-sm border-border focus:border-[#C17A2B] focus:ring-[#C17A2B] sm:max-w-sm"
                    />
                )}

                {/* Column Visibility */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-md border-border sm:ms-auto sm:w-auto"
                        >
                            <Settings2 className="mr-2 h-4 w-4" />
                            {t("common.columns")}
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-50 bg-white">
                        {table
                            .getAllColumns()
                            .filter(
                                (column) =>
                                    typeof column.accessorFn !== "undefined" && column.getCanHide()
                            )
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="max-w-full overflow-hidden rounded-lg border border-border bg-white">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                >
                    <Table className="min-w-max">
                        <TableHeader className="bg-[#FAF0DC]">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {enableDragDrop && <TableHead className="w-10"></TableHead>}
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead
                                                key={header.id}
                                                className="text-[#3D1C00] font-semibold"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                <SortableContext
                                    items={dataIds}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {table.getRowModel().rows.map((row) => (
                                        <DraggableRow
                                            key={row.id}
                                            row={row}
                                            enableDragDrop={enableDragDrop}
                                        />
                                    ))}
                                </SortableContext>
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            tableColumns.length + (enableDragDrop ? 1 : 0)
                                        }
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {t("common.noResults")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-2">
                <div className="text-sm text-muted-foreground sm:flex-1">
                    {table.getFilteredSelectedRowModel().rows.length} {t("common.of")}{" "}
                    {table.getFilteredRowModel().rows.length} {t("common.rows")} {t("common.selected")}.
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end lg:gap-6">
                    <div className="hidden items-center gap-2 sm:flex">
                        <p className="text-sm font-medium text-[#3D1C00]">{t("common.rowsPerPage")}</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value));
                            }}
                        >
                            <SelectTrigger className="h-8 w-17.5 rounded-sm border-border">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex min-w-24 items-center justify-center text-sm font-medium text-[#3D1C00]">
                        {t("common.page")} {table.getState().pagination.pageIndex + 1} {t("common.of")}{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex rounded-md border-border"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">{t("common.firstPage")}</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-md border-border"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">{t("common.previous")}</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-md border-border"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">{t("common.next")}</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex rounded-md border-border"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
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
