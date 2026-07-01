# 📊 Guide : Tableau Interactif Avancé (shadcn/ui)

## 🎯 Fonctionnalités Disponibles

Le tableau avancé de shadcn/ui inclut :

✅ **Drag & Drop** - Réorganiser les lignes  
✅ **Sélection multiple** - Checkboxes  
✅ **Tri des colonnes** - Ascendant/Descendant  
✅ **Colonnes personnalisables** - Afficher/Masquer  
✅ **Pagination** - Navigation entre pages  
✅ **Filtres** - Recherche par colonne  
✅ **Actions en masse** - Supprimer plusieurs lignes  
✅ **Lignes éditables** - Modifier inline  

---

## 📦 Installation des Dépendances

```bash
# TanStack Table (gestion du tableau)
npm install @tanstack/react-table

# DnD Kit (drag & drop)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Modifiers (restrict drag to vertical)
npm install @dnd-kit/modifiers
```

---

## 🏗️ Structure du Composant

```
src/components/ui/
├── data-table.tsx          # Composant principal du tableau
├── table.tsx               # Composants Table de base (déjà présent)
├── checkbox.tsx            # Checkboxes pour sélection
├── dropdown-menu.tsx       # Menu d'actions
└── pagination.tsx          # Contrôles de pagination
```

---

## 📝 Exemple d'Implémentation

### 1. Définir les Colonnes

```tsx
import { ColumnDef } from "@tanstack/react-table";

type Agriculteur = {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  nbPalmiers: number;
};

export const columns: ColumnDef<Agriculteur>[] = [
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
  },
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "nom",
    header: "Nom",
  },
  {
    accessorKey: "prenom",
    header: "Prénom",
  },
  {
    accessorKey: "nbPalmiers",
    header: "Nb Palmiers",
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsDropdown row={row} />,
  },
];
```

### 2. Composant DataTable

```tsx
"use client";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

export function DataTable<TData, TValue>({
  columns,
  data,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div>
      {/* Search Input */}
      <div className="flex items-center py-4">
        <Input
          placeholder="Rechercher..."
          value={(table.getColumn("nom")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("nom")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} sur{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
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

### 3. Utilisation dans la Page

```tsx
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export default async function AgricultureursPage() {
  const data = await getAgriculteurs();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Agriculteurs</h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
```

---

## 🎨 Fonctionnalités Avancées

### Drag & Drop

```tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function DraggableRow({ row }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: row.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </TableCell>
      {/* Autres cellules */}
    </TableRow>
  );
}
```

### Colonnes Personnalisables

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <Settings className="mr-2 h-4 w-4" />
      Colonnes
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
          onCheckedChange={(value) => column.toggleVisibility(!!value)}
        >
          {column.id}
        </DropdownMenuCheckboxItem>
      ))}
  </DropdownMenuContent>
</DropdownMenu>
```

### Actions en Masse

```tsx
{table.getFilteredSelectedRowModel().rows.length > 0 && (
  <Button
    variant="destructive"
    size="sm"
    onClick={() => {
      const selectedIds = table.getFilteredSelectedRowModel().rows.map((row) => row.original.id);
      // Supprimer les lignes sélectionnées
      handleBulkDelete(selectedIds);
    }}
  >
    Supprimer ({table.getFilteredSelectedRowModel().rows.length})
  </Button>
)}
```

---

## 🚀 Prochaines Étapes

1. **Installer les dépendances** : `npm install @tanstack/react-table @dnd-kit/core @dnd-kit/sortable`
2. **Créer un composant DataTable générique** dans `src/components/ui/data-table.tsx`
3. **Définir les colonnes** pour chaque entité (Agriculteurs, Régions, Users, Roles)
4. **Remplacer les tables actuelles** par le nouveau DataTable
5. **Tester toutes les fonctionnalités** (tri, filtres, pagination, sélection)

---

## 📚 Ressources

- [TanStack Table Docs](https://tanstack.com/table/latest)
- [DnD Kit Docs](https://docs.dndkit.com/)
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table)
- [shadcn/ui Blocks - Dashboard](https://ui.shadcn.com/blocks#dashboard-01)

---

**Note** : Le code de shadcn/ui blocks utilise des composants spécifiques. Je peux créer une version adaptée à votre projet avec le thème "Dattes" si vous voulez !
