# Architecture Gestion Dattes

## 📁 Structure des dossiers

```
src/
├── app/                          ← Next.js 15 App Router - routing uniquement
│   ├── (auth)/                   ← Route group pour les pages d'authentification
│   ├── (dashboard)/              ← Route group pour les pages protégées
│   └── api/                      ← API routes (webhooks externes uniquement)
│
├── actions/                      ← Server Actions (mutations uniquement)
│   ├── roles/
│   ├── users/
│   └── audit/
│
├── services/                     ← Logique métier + permissions + audit
│   ├── role.service.ts
│   ├── user.service.ts
│   └── audit.service.ts
│
├── repositories/                 ← Accès aux données Prisma uniquement
│   ├── role.repository.ts
│   ├── user.repository.ts
│   └── audit.repository.ts
│
├── validators/                   ← Schémas Zod
│   ├── role.validator.ts
│   └── user.validator.ts
│
├── lib/                          ← Utilitaires système
│   ├── prisma.ts
│   ├── auth.ts
│   ├── routes.ts
│   └── permissions.ts
│
├── components/
│   ├── ui/                       ← Shadcn (NE PAS MODIFIER)
│   ├── shared/                   ← Composants réutilisables custom
│   ├── forms/                    ← Formulaires React Hook Form
│   └── features/                 ← Composants par feature
│
├── hooks/                        ← Hooks React client
├── types/                        ← Types TypeScript globaux
└── constants/                    ← Constantes de l'application
    ├── roles.ts
    ├── permissions.ts
    ├── pagination.ts
    └── audit-actions.ts
```

## 🔄 Flux de données OBLIGATOIRE

```
Server Action → Service → Repository → Prisma → PostgreSQL
```

### ❌ JAMAIS :
- Prisma directement dans une Server Action
- Prisma dans un composant
- Logique métier dans un Repository
- `fetch()` interne vers ses propres API Routes

## 🎨 Design System - Couleurs Dattes

### Palette principale
- **Page background**: `#FAF0DC` (sand)
- **Card/surface**: `#FFFFFF`
- **Primary**: `#C17A2B` (amber dattes)
- **Primary dark**: `#8B4A0F`
- **Sidebar**: `#3D1C00` (espresso)
- **Border**: `#F0E0C0`

### Utilisation Tailwind
```tsx
// Bouton principal
<button className="bg-dattes-400 hover:bg-dattes-600 text-white rounded-md px-4 py-2">

// Card
<div className="bg-white border border-[#F0E0C0] rounded-lg p-6">

// Page background
<div className="bg-sand min-h-screen">
```

## 🔐 Système de permissions

### Rôles disponibles
- `SUPER_ADMIN` - Tous les droits
- `ADMIN` - Gestion complète
- `DIRECTEUR` - Lecture avancée
- `GESTIONNAIRE` - Gestion opérationnelle
- `LABORANTIN` - Analyses uniquement

### Utilisation dans les services
```typescript
export const userService = {
  async createUser(data: CreateUserInput) {
    await requirePermission("users:create"); // ← Toujours en première ligne
    
    // ... logique métier
    
    await auditService.log({              // ← Toujours après mutation
      actorId: session.user.id,
      action: "CREATE_USER",
      description: `Création de ${data.name}`,
    });
  }
};
```

## 📝 Conventions de nommage

| Type | Convention | Exemple |
|------|-----------|---------|
| Fichiers | kebab-case | `create-user.action.ts` |
| Composants | PascalCase | `UserTable.tsx` |
| Hooks | camelCase + use | `useDebounce.ts` |
| Server Actions | camelCase + Action | `createUserAction` |
| Services | camelCase + Service | `userService` |
| Repositories | camelCase + Repository | `userRepository` |
| Validators | camelCase + Validator | `createUserValidator` |
| Types | PascalCase | `UserTypes.ts` |
| Constants | SCREAMING_SNAKE | `MAX_PAGE_SIZE` |

## 🚀 Exemple complet - Création d'une feature

### 1. Validator (`validators/role.validator.ts`)
```typescript
import { z } from "zod";

export const createRoleValidator = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
});
```

### 2. Repository (`repositories/role.repository.ts`)
```typescript
export const roleRepository = {
  async create(data: { name: string; description?: string }) {
    return prisma.role.create({
      data,
      select: { id: true, name: true, createdAt: true },
    });
  },
};
```

### 3. Service (`services/role.service.ts`)
```typescript
export const roleService = {
  async createRole(data: CreateRoleInput) {
    await requirePermission("roles:create");
    
    const role = await roleRepository.create(data);
    
    const session = await auth();
    await auditService.log({
      actorId: session.user.id,
      action: "CREATE_ROLE",
      targetId: role.id,
    });
    
    return role;
  },
};
```

### 4. Server Action (`actions/roles/create-role.action.ts`)
```typescript
"use server";

import { revalidateTag } from "next/cache";

export async function createRoleAction(formData: unknown) {
  const parsed = createRoleValidator.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  
  try {
    const data = await roleService.createRole(parsed.data);
    revalidateTag("roles");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur interne" };
  }
}
```

### 5. Page RSC (`app/(dashboard)/roles/page.tsx`)
```typescript
import { roleService } from "@/services/role.service";
import { RolesTable } from "@/components/features/roles/RolesTable";

export default async function RolesPage() {
  const { data, total } = await roleService.getRoles();
  
  return (
    <div className="p-6 bg-sand min-h-screen">
      <h1 className="text-2xl font-bold text-[#2C1A00] mb-6">Gestion des rôles</h1>
      <RolesTable data={data} total={total} />
    </div>
  );
}
```

### 6. Composant Client (`components/features/roles/RolesTable.tsx`)
```typescript
"use client";

import { createRoleAction } from "@/actions/roles/create-role.action";

export function RolesTable({ data, total }) {
  async function handleCreate(formData: FormData) {
    const result = await createRoleAction({
      name: formData.get("name"),
      description: formData.get("description"),
    });
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Rôle créé");
    }
  }
  
  return <form action={handleCreate}>...</form>;
}
```

## 📊 Cache Strategy

| Type de données | Revalidation | Tag |
|----------------|--------------|-----|
| Rôles, config | 3600s | `roles` |
| Users, livraisons | 30s | `users`, `livraisons` |
| Stats dashboard | 300s | `stats` |
| Audit logs | 0s | jamais caché |

## ✅ Checklist avant chaque PR

- [ ] Pas de Prisma en dehors des repositories
- [ ] `requirePermission()` en première ligne des services
- [ ] `auditService.log()` après chaque mutation
- [ ] Validation Zod dans toutes les Server Actions
- [ ] `revalidateTag()` après chaque mutation
- [ ] Pas de `"use client"` inutile
- [ ] Suspense sur chaque section indépendante
- [ ] Types TypeScript stricts (pas de `any`)
- [ ] Couleurs Dattes respectées
- [ ] Pas de modification dans `components/ui/`

---

**Version**: 1.0.0  
**Dernière mise à jour**: Juin 2026
