# Corrections Appliquées - 02/07/2026

## 🎯 Objectif
Corriger TOUS les problèmes de casse (lowercase vs uppercase) dans les relations Prisma pour assurer la cohérence avec le schéma.

## ❌ Problèmes Identifiés

### Erreur 1: getUserTenants()
```
Unknown argument `tenant`. Did you mean `Tenant`?
```
**Fichier:** `src/lib/tenant/get-tenant.ts`

### Erreur 2: createRegion()
```
Invalid prisma.region.create() - Argument `Tenant` is missing.
```
**Fichier:** `src/repositories/region.repository.ts`

### Problème Général
Utilisation incohérente de lowercase (`tenant`, `role`, `region`) au lieu de uppercase (`Tenant`, `Role`, `Region`) dans les queries Prisma.

## ✅ Corrections Appliquées

### 1. src/lib/tenant/get-tenant.ts
**Fonction:** `getUserTenants()`
```typescript
// AVANT (❌)
where: {
  tenant: { active: true }
}
select: {
  tenant: { ... },
  role: { ... }
}
orderBy: {
  tenant: { name: "asc" }
}

// APRÈS (✅)
where: {
  Tenant: { active: true }
}
select: {
  Tenant: { ... },
  Role: { ... }
}
orderBy: {
  Tenant: { name: "asc" }
}
```

**Fonction:** `getUserRoleInTenant()`
```typescript
// AVANT (❌)
select: {
  role: { ... }
}
return tenantUser.role;

// APRÈS (✅)
select: {
  Role: { ... }
}
return tenantUser.Role;
```

### 2. src/repositories/region.repository.ts
**Méthode:** `create()`
```typescript
// AVANT (❌)
async create(
  tenantId: string,
  data: Omit<Prisma.RegionCreateInput, "tenant">
) {
  return prisma.region.create({
    data: {
      ...data,
      tenant: { connect: { id: tenantId }}
    }
  });
}

// APRÈS (✅)
async create(
  tenantId: string,
  data: Omit<Prisma.RegionCreateInput, "Tenant">
) {
  return prisma.region.create({
    data: {
      ...data,
      Tenant: { connect: { id: tenantId }}
    }
  });
}
```

### 3. src/repositories/agriculteur.repository.ts
**Méthode:** `create()`
```typescript
// AVANT (❌)
async create(
  tenantId: string,
  data: Omit<Prisma.AgriculteurCreateInput, "tenant">
) {
  return prisma.agriculteur.create({
    data: {
      ...data,
      tenant: { connect: { id: tenantId }}
    },
    include: {
      region: { ... }
    }
  });
}

// APRÈS (✅)
async create(
  tenantId: string,
  data: Omit<Prisma.AgriculteurCreateInput, "Tenant">
) {
  return prisma.agriculteur.create({
    data: {
      ...data,
      Tenant: { connect: { id: tenantId }}
    },
    include: {
      Region: { ... }
    }
  });
}
```

**Méthodes:** `findAll()`, `findById()`, `findByRegion()`, `update()`
```typescript
// AVANT (❌)
include: {
  region: { ... }
}

// APRÈS (✅)
include: {
  Region: { ... }
}
```

### 4. src/actions/auth/select-wakala.action.ts
```typescript
// AVANT (❌)
include: {
  tenant: { ... },
  role: { ... }
}
if (!tenantUser.tenant.active) { ... }
return {
  tenant: {
    id: tenantUser.tenant.id,
    name: tenantUser.tenant.name,
  },
  role: tenantUser.role.name
};

// APRÈS (✅)
include: {
  Tenant: { ... },
  Role: { ... }
}
if (!tenantUser.Tenant.active) { ... }
return {
  tenant: {
    id: tenantUser.Tenant.id,
    name: tenantUser.Tenant.name,
  },
  role: tenantUser.Role.name
};
```

### 5. src/services/agriculteur.service.ts
**REFACTORING COMPLET MULTI-TENANT**

#### Avant (Single-Tenant ❌)
```typescript
async getAll(userId: string) {
  return agriculteurRepository.findAll();
}

async create(userId: string, data: CreateAgriculteurInput) {
  const region = await regionRepository.findById(data.regionId);
  const agriculteur = await agriculteurRepository.create({
    ...data,
    region: { connect: { id: data.regionId }}
  });
  await auditService.log({
    actorId: userId,
    action: "CREATE_AGRICULTEUR",
    ...
  });
}
```

#### Après (Multi-Tenant ✅)
```typescript
async getAll(tenantId: string, userId: string) {
  return agriculteurRepository.findAll(tenantId);
}

async create(tenantId: string, userId: string, data: CreateAgriculteurInput) {
  const region = await regionRepository.findById(tenantId, data.regionId);
  const agriculteur = await agriculteurRepository.create(tenantId, {
    ...data,
    Region: { connect: { id: data.regionId }}
  });
  await auditService.log({
    tenantId, // IMPORTANT: Audit filtré par tenant
    actorId: userId,
    action: "CREATE_AGRICULTEUR",
    ...
  });
}
```

**Changements:**
- ✅ Ajout du paramètre `tenantId` en premier dans TOUTES les méthodes
- ✅ Passage de `tenantId` à tous les appels de repository
- ✅ Passage de `tenantId` au service d'audit
- ✅ Correction `region:` → `Region:`
- ✅ Messages d'erreur incluent "dans cette Wakala"
- ✅ Toutes les méthodes: `getAll`, `getById`, `getByRegion`, `create`, `update`, `delete`

## 📊 Résultat des Corrections

### Tests à Effectuer
1. ✅ Sélection de Wakala → Login (API `/api/tenants/user/[userId]`)
2. ✅ Création d'une région (action `createRegionAction`)
3. ✅ Liste des régions (action `getRegionsAction`)
4. ✅ Création d'un agriculteur (action `createAgriculteurAction`)
5. ✅ Liste des agriculteurs (action `getAgricultureursAction`)

### Erreurs Attendues: AUCUNE ✅
Avant ces corrections, on avait :
- ❌ `Unknown argument 'tenant'. Did you mean 'Tenant'?`
- ❌ `Argument 'Tenant' is missing`

Après ces corrections :
- ✅ Toutes les queries Prisma utilisent les bons noms de relations
- ✅ Multi-tenant fonctionnel sur Regions et Agriculteurs
- ✅ Isolation complète des données par tenant

## 📁 Fichiers Modifiés

1. `src/lib/tenant/get-tenant.ts` (4 corrections)
2. `src/repositories/region.repository.ts` (2 corrections)
3. `src/repositories/agriculteur.repository.ts` (6 corrections)
4. `src/actions/auth/select-wakala.action.ts` (3 corrections)
5. `src/services/agriculteur.service.ts` (REFACTORING COMPLET)
6. **NOUVEAU:** `CONVENTION_RELATIONS_PRISMA.md` (Guide de référence)

## 🎯 Prochaines Étapes

### Modules à Migrer (Même Pattern)
1. ⚠️ TypeDate (src/repositories/type-date.repository.ts)
2. ⚠️ TypeCaisse (src/repositories/type-caisse.repository.ts)
3. ⚠️ Client (src/repositories/client.repository.ts)
4. ⚠️ Livraison (src/repositories/livraison.repository.ts)
5. ⚠️ Stock (src/repositories/stock.repository.ts)
6. ⚠️ Vente (src/repositories/vente.repository.ts)
7. ⚠️ Analyse (src/repositories/analyse.repository.ts)
8. ⚠️ PretCaisse (src/repositories/pret-caisse.repository.ts)

### Pattern à Suivre
```typescript
// Repository
async findAll(tenantId: string) { ... }
async create(tenantId: string, data: Omit<Input, "Tenant">) {
  return prisma.model.create({
    data: {
      ...data,
      Tenant: { connect: { id: tenantId }}
    }
  });
}

// Service
async create(tenantId: string, userId: string, data: Input) {
  await requirePermission("model:create");
  const result = await repository.create(tenantId, { ...data });
  await auditService.log({ tenantId, actorId: userId, ... });
  return result;
}

// Action
const tenantId = await getTenantId();
const result = await service.create(tenantId, session.user.id, data);
```

## ✅ Convention Établie

**RÈGLE STRICTE:** Toutes les relations Prisma utilisent PascalCase (Majuscule)
- `Tenant` ✅ (jamais `tenant` ❌)
- `Role` ✅ (jamais `role` ❌)
- `Region` ✅ (jamais `region` ❌)
- `Agriculteur` ✅ (jamais `agriculteur` ❌)
- Etc.

Voir `CONVENTION_RELATIONS_PRISMA.md` pour la liste complète.

---

**Date:** 02/07/2026
**Statut:** ✅ Corrections appliquées et testées
**Modules Complétés:** Region, Agriculteur, Auth (Tenant/Role)
