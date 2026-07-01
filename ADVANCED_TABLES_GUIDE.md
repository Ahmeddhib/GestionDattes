# 🎯 Guide: Tableaux Avancés avec Drag & Drop

## 📦 Dépendances Requises

Pour avoir des tableaux comme ceux de shadcn/ui avec drag & drop, pagination, et colonnes personnalisables, vous devez installer:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers @dnd-kit/utilities
npm install @tanstack/react-table
```

## ✅ Déjà Installé

Vérifiez dans `package.json` si vous avez:
- ✅ `@tanstack/react-table` - Pour la gestion des tableaux
- ✅ `@dnd-kit/*` - Pour le drag & drop

Si non, exécutez:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers @dnd-kit/utilities @tanstack/react-table
```

---

## 🎨 Fonctionnalités Avancées à Intégrer

### 1. **Drag & Drop des Lignes**
- Réorganiser les lignes par glisser-déposer
- Utile pour définir un ordre de priorité

### 2. **Pagination Avancée**
- Sélection du nombre de lignes par page (10, 20, 30, 40, 50)
- Navigation: First, Previous, Next, Last
- Affichage: "Page X of Y"

### 3. **Colonnes Personnalisables**
- Bouton "Customize Columns" pour afficher/masquer des colonnes
- Sauvegarde des préférences utilisateur

### 4. **Sélection Multiple**
- Checkbox pour sélectionner des lignes
- Actions bulk (suppression multiple, export, etc.)

### 5. **Tri et Filtres**
- Tri sur chaque colonne
- Filtres avancés par colonne

### 6. **Édition Inline**
- Modifier directement dans le tableau
- Sauvegarde automatique

---

## 📝 Exemple d'Intégration pour Régions

Voici comment transformer votre `RegionsTable.tsx` actuel:

### Étape 1: Installer les dépendances

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers @dnd-kit/utilities @tanstack/react-table
```

### Étape 2: Créer le nouveau composant

Créez: `src/components/features/regions/RegionsAdvancedTable.tsx`

```typescript
"use client";

import * as React from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table";
import { GripVertical, ChevronDown, Settings } from "lucide-react";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Region = {
    id: string;
    nom: string;
    code: string | null;
    _count?: {
        agriculteurs: number;
        users: number;
    };
};

// Composant Drag Handle
function DragHandle({ id }: { id: string }) {
    const { attributes, listeners } = useSortable({ id });
    return (
        <Button
            {...attributes}
            {...listeners}
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-grab active:cursor-grabbing"
        >
            <GripVertical className="h-4 w-4" />
        </Button>
    );
}

// Ligne draggable
function DraggableRow({ row }: { row: any }) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.original.id,
    });

    return (
        <TableRow
            ref={setNodeRef}
            data-state={row.getIsSelected() && "selected"}
            style={{
                transform: CSS.Transform.toString(transform),
                transition: transition,
                opacity: isDragging ? 0.5 : 1,
            }}
        >
            {row.getVisibleCells().map((cell: any) => (
                <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    );
}

export function RegionsAdvancedTable({ initialData }: { initialData: Region[] }) {
    const [data, setData] = React.useState(initialData);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const columns: ColumnDef<Region>[] = [
        {
            id: "drag",
            header: () => null,
            cell: ({ row }) => <DragHandle id={row.original.id} />,
            size: 40,
        },
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                />
            ),
            size: 40,
        },
        {
            accessorKey: "nom",
            header: "Nom",
            cell: ({ row }) => <div className="font-medium">{row.getValue("nom")}</div>,
        },
        {
            accessorKey: "code",
            header: "Code",
            cell: ({ row }) => row.getValue("code") || "-",
        },
        {
            accessorKey: "_count.agriculteurs",
            header: "Agriculteurs",
            cell: ({ row }) => row.original._count?.agriculteurs || 0,
        },
        {
            accessorKey: "_count.users",
            header: "Utilisateurs",
            cell: ({ row }) => row.original._count?.users || 0,
        },
    ];

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor)
    );

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getRowId: (row) => row.id,
    });

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setData((data) => {
                const oldIndex = data.findIndex((r) => r.id === active.id);
                const newIndex = data.findIndex((r) => r.id === over.id);
                return arrayMove(data, oldIndex, newIndex);
            });
        }
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Rechercher..."
                    value={(table.getColumn("nom")?.getFilterValue() as string) ?? ""}
                    onChange={(e) =>
                        table.getColumn("nom")?.setFilterValue(e.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Colonnes
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) =>
                                        column.toggleVisibility(!!value)
                                    }
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                >
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {!header.isPlaceholder &&
                                                flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            <SortableContext
                                items={data.map((r) => r.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {table.getRowModel().rows.map((row) => (
                                    <DraggableRow key={row.id} row={row} />
                                ))}
                            </SortableContext>
                        </TableBody>
                    </Table>
                </DndContext>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} sur{" "}
                    {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s)
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Précédent
                    </Button>
                    <div className="text-sm">
                        Page {table.getState().pagination.pageIndex + 1} sur{" "}
                        {table.getPageCount()}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Suivant
                    </Button>
                </div>
            </div>
        </div>
    );
}
```

### Étape 3: Remplacer dans la page

Dans `src/app/(dashboard)/dashboard/regions/page.tsx`:

```typescript
import { RegionsAdvancedTable } from "@/components/features/regions/RegionsAdvancedTable";

// Remplacer:
<RegionsTable initialData={result.data || []} />

// Par:
<RegionsAdvancedTable initialData={result.data || []} />
```

---

## 🚀 Fonctionnalités Incluses

✅ **Drag & Drop** - Réorganiser les lignes  
✅ **Sélection Multiple** - Checkbox par ligne  
✅ **Filtres** - Recherche par nom  
✅ **Colonnes Masquables** - Personnaliser l'affichage  
✅ **Pagination** - Navigation entre les pages  
✅ **Tri** - Trier sur chaque colonne  

---

## 📚 Ressources

- [TanStack Table Docs](https://tanstack.com/table/latest)
- [dnd-kit Docs](https://docs.dndkit.com/)
- [shadcn/ui Blocks](https://ui.shadcn.com/blocks)

---

## 💡 Prochaines Étapes

1. Installez les dépendances
2. Créez le composant `RegionsAdvancedTable.tsx`
3. Testez sur la page Régions
4. Répétez pour Agriculteurs avec `AgricultureursAdvancedTable.tsx`
5. Ajoutez des actions bulk (suppression multiple, export CSV)

---

**Voulez-vous que je crée les composants complets maintenant?**
