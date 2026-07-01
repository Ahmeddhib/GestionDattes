# ✅ Gestion des Régions et Agriculteurs - TERMINÉ

## 📁 Fichiers Créés

### 1. Validators (Validation Zod)
- ✅ `src/validators/region.validator.ts`
- ✅ `src/validators/agriculteur.validator.ts`

### 2. Repositories (Accès aux données Prisma)
- ✅ `src/repositories/region.repository.ts`
- ✅ `src/repositories/agriculteur.repository.ts`

### 3. Services (Logique métier + RBAC + Audit)
- ✅ `src/services/region.service.ts`
- ✅ `src/services/agriculteur.service.ts`

### 4. Server Actions (Actions côté serveur)
**Régions:**
- ✅ `src/actions/regions/get-regions.action.ts`
- ✅ `src/actions/regions/create-region.action.ts`
- ✅ `src/actions/regions/update-region.action.ts`
- ✅ `src/actions/regions/delete-region.action.ts`

**Agriculteurs:**
- ✅ `src/actions/agriculteurs/get-agriculteurs.action.ts`
- ✅ `src/actions/agriculteurs/create-agriculteur.action.ts`
- ✅ `src/actions/agriculteurs/update-agriculteur.action.ts`
- ✅ `src/actions/agriculteurs/delete-agriculteur.action.ts`

### 5. Permissions
- ✅ Mis à jour `src/constants/permissions.ts`

---

## 🔐 Permissions RBAC

### Régions
| Action | Rôles autorisés |
|--------|----------------|
| `region:read` | ADMIN, AGENT, LABORANTIN, RESPONSABLE_STOCK, DIRECTION |
| `region:create` | ADMIN |
| `region:update` | ADMIN |
| `region:delete` | ADMIN |

### Agriculteurs
| Action | Rôles autorisés |
|--------|----------------|
| `agriculteur:read` | ADMIN, AGENT, RESPONSABLE_STOCK, DIRECTION |
| `agriculteur:create` | ADMIN, AGENT |
| `agriculteur:update` | ADMIN, AGENT |
| `agriculteur:delete` | ADMIN |

---

## 🎯 Fonctionnalités Backend

### Régions

#### ✅ Récupérer toutes les régions
```typescript
const result = await getRegionsAction();
// Retourne: { success: true, data: Region[] }
```

**Données incluses:**
- ID, nom, code
- Nombre d'agriculteurs associés (`_count.agriculteurs`)
- Nombre d'utilisateurs associés (`_count.users`)

#### ✅ Créer une région
```typescript
const result = await createRegionAction({
  nom: "Kebili",
  code: "KB", // optionnel
});
```

**Validations:**
- `nom`: min 2 caractères
- `code`: min 2, max 10 caractères (optionnel)
- Code doit être unique

**Audit:** ✅ Log `CREATE_REGION`

#### ✅ Mettre à jour une région
```typescript
const result = await updateRegionAction({
  id: "region-id",
  nom: "Nouveau nom", // optionnel
  code: "NV",         // optionnel
});
```

**Validations:**
- Si code modifié → vérifier unicité

**Audit:** ✅ Log `UPDATE_REGION`

#### ✅ Supprimer une région
```typescript
const result = await deleteRegionAction("region-id");
```

**Règles métier:**
- ❌ Impossible si la région a des agriculteurs associés
- ❌ Impossible si la région a des utilisateurs associés

**Audit:** ✅ Log `DELETE_REGION`

---

### Agriculteurs

#### ✅ Récupérer tous les agriculteurs
```typescript
const result = await getAgricultureursAction();
// Retourne: { success: true, data: Agriculteur[] }
```

**Données incluses:**
- Toutes les infos agriculteur
- Région (id, nom, code)
- Nombre de livraisons (`_count.livraisons`)
- Nombre de prêts de caisses (`_count.pretCaisses`)

#### ✅ Créer un agriculteur
```typescript
const result = await createAgriculteurAction({
  code: "AGR001",
  cin: "12345678",
  nom: "Ben Ahmed",
  prenom: "Mohamed",
  telephone: "+216 98 123 456",     // optionnel
  adresse: "Douz, Kebili",          // optionnel
  nbPalmiers: 150,
  superficie: 2.5,                  // optionnel
  productionEstimee: 3000,          // optionnel
  regionId: "region-id",
});
```

**Validations:**
- `code`: min 3, max 20 caractères (doit être unique)
- `cin`: exactement 8 caractères (doit être unique)
- `nom`, `prenom`: min 2 caractères
- `nbPalmiers`: min 1
- `superficie`, `productionEstimee`: si fournis, doivent être positifs
- `regionId`: région doit exister

**Audit:** ✅ Log `CREATE_AGRICULTEUR`

#### ✅ Mettre à jour un agriculteur
```typescript
const result = await updateAgriculteurAction({
  id: "agriculteur-id",
  // Tous les champs sont optionnels
  code: "AGR002",
  cin: "87654321",
  nom: "Nouveau nom",
  prenom: "Nouveau prénom",
  // ...
});
```

**Validations:**
- Si code modifié → vérifier unicité
- Si cin modifié → vérifier unicité
- Si regionId modifié → vérifier existence

**Audit:** ✅ Log `UPDATE_AGRICULTEUR`

#### ✅ Supprimer un agriculteur
```typescript
const result = await deleteAgriculteurAction("agriculteur-id");
```

**Règles métier:**
- ❌ Impossible si l'agriculteur a des livraisons
- ❌ Impossible si l'agriculteur a des prêts de caisses en cours

**Audit:** ✅ Log `DELETE_AGRICULTEUR`

---

## 📊 Schéma Prisma

### Region
```prisma
model Region {
  id           String        @id @default(cuid())
  nom          String
  code         String?       @unique
  agriculteurs Agriculteur[]
  users        User[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}
```

### Agriculteur
```prisma
model Agriculteur {
  id                String       @id @default(cuid())
  code              String       @unique
  cin               String       @unique
  nom               String
  prenom            String
  telephone         String?
  adresse           String?
  nbPalmiers        Int
  superficie        Float?
  productionEstimee Float?
  regionId          String
  region            Region       @relation(fields: [regionId], references: [id])
  livraisons        Livraison[]
  pretCaisses       PretCaisse[]
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
}
```

---

## 🚀 Prochaines Étapes

Pour créer l'interface utilisateur (UI), vous devez créer:

### Pages Next.js
1. `src/app/(dashboard)/dashboard/regions/page.tsx` - Liste des régions
2. `src/app/(dashboard)/dashboard/agriculteurs/page.tsx` - Liste des agriculteurs

### Composants UI
1. `src/components/features/regions/RegionsTable.tsx`
2. `src/components/features/regions/CreateRegionDialog.tsx`
3. `src/components/features/regions/UpdateRegionDialog.tsx`
4. `src/components/features/regions/DeleteRegionDialog.tsx`

5. `src/components/features/agriculteurs/AgricultureursTable.tsx`
6. `src/components/features/agriculteurs/CreateAgriculteurDialog.tsx`
7. `src/components/features/agriculteurs/UpdateAgriculteurDialog.tsx`
8. `src/components/features/agriculteurs/DeleteAgriculteurDialog.tsx`

### Navigation
9. Mettre à jour `src/components/layout/Sidebar.tsx` pour ajouter les liens:
   - 🗺️ Régions
   - 👨‍🌾 Agriculteurs

---

## ✅ Architecture Respectée

```
UI (Pages/Components)
        ↓
Server Actions (*.action.ts)
        ↓
Services (*.service.ts)
  ├─ RBAC (requirePermission)
  ├─ Validation métier
  └─ Audit (auditService.log)
        ↓
Repositories (*.repository.ts)
        ↓
Prisma Client
        ↓
PostgreSQL (Neon)
```

---

## 🎨 Style Dattes

N'oubliez pas d'utiliser le thème Dattes dans l'UI:
- Couleur primaire: `#C17A2B` (amber)
- Fond: `#FAF0DC` (sand)
- Sidebar: `#3D1C00` (espresso)
- Bordures: `#F0E0C0`
- Border-radius: 14px (cards), 9px (buttons), 7px (inputs)

---

**Date**: 29 juin 2026
**Status**: ✅ Backend complet
**Prochaine étape**: Créer l'UI (pages + composants)
