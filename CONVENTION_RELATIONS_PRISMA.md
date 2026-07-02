# Convention des Relations Prisma - RÈGLE STRICTE

## ⚠️ RÈGLE ABSOLUE
**TOUS les noms de relations dans le schéma Prisma sont en MAJUSCULE (PascalCase)**

Cette règle s'applique à TOUTES les opérations Prisma dans le code TypeScript.

## ✅ Relations Correctes (MAJUSCULE)

### Relations Multi-Tenant Principales
```typescript
// ✅ CORRECT
Tenant: {
  connect: { id: tenantId }
}

// ❌ INCORRECT
tenant: {
  connect: { id: tenantId }
}
```

### Relations dans _count
**IMPORTANT**: Les noms de relations dans `_count` doivent aussi être en MAJUSCULE!

```typescript
// ✅ CORRECT
_count: {
  select: {
    Livraison: true,    // Majuscule
    PretCaisse: true,   // Majuscule
    Agriculteur: true   // Majuscule
  }
}

// ❌ INCORRECT
_count: {
  select: {
    livraisons: true,   // Lowercase - ERREUR!
    pretCaisses: true,  // Lowercase - ERREUR!
    agriculteurs: true  // Lowercase - ERREUR!
  }
}
```

### Relations Métier
```typescript
// ✅ CORRECT - Agriculteur vers Region
Region: {
  connect: { id: regionId }
}

// ✅ CORRECT - TenantUser vers Role
Role: {
  select: {
    id: true,
    name: true
  }
}

// ✅ CORRECT - Livraison vers Agriculteur
Agriculteur: {
  connect: { id: agriculteurId }
}

// ✅ CORRECT - Include dans les queries
include: {
  Region: {
    select: {
      id: true,
      nom: true,
      code: true
    }
  },
  Tenant: {
    select: {
      name: true
    }
  }
}
```

## 📋 Liste Complète des Relations (Référence Schéma)

Voici TOUTES les relations du schéma `schema.prisma` - **utiliser EXACTEMENT ces noms** :

### Relations vers Tenant (Multi-Tenant)
- `Tenant` ✅ (jamais `tenant` ❌)

### Relations vers User
- `User` ✅ (jamais `user` ❌)

### Relations vers Role
- `Role` ✅ (jamais `role` ❌)

### Relations Métier Agricoles
- `Region` ✅ (jamais `region` ❌)
- `Agriculteur` ✅ (jamais `agriculteur` ❌)
- `Livraison` ✅ (jamais `livraison` ❌)
- `Echantillon` ✅ (jamais `echantillon` ❌)
- `Analyse` ✅ (jamais `analyse` ❌)
- `Pesee` ✅ (jamais `pesee` ❌)
- `BonAchat` ✅ (jamais `bonAchat` ❌)
- `BonSortie` ✅ (jamais `bonSortie` ❌)

### Relations Stock et Types
- `TypeDate` ✅ (jamais `typeDate` ❌)
- `TypeCaisse` ✅ (jamais `typeCaisse` ❌)
- `StockDate` ✅ (jamais `stockDate` ❌)
- `Conditionnement` ✅ (jamais `conditionnement` ❌)
- `PretCaisse` ✅ (jamais `pretCaisse` ❌)

### Relations Vente
- `Client` ✅ (jamais `client` ❌)
- `Vente` ✅ (jamais `vente` ❌)

## 🔍 Erreurs Courantes et Solutions

### Erreur 1: `Unknown argument 'tenant'. Did you mean 'Tenant'?`
```typescript
// ❌ INCORRECT
where: {
  tenant: { active: true }
}

// ✅ CORRECT
where: {
  Tenant: { active: true }
}
```

### Erreur 2: `Argument 'Tenant' is missing`
```typescript
// ❌ INCORRECT - lowercase dans create
data: {
  nom: "Test",
  tenant: { connect: { id: tenantId }}
}

// ✅ CORRECT - uppercase
data: {
  nom: "Test",
  Tenant: { connect: { id: tenantId }}
}
```

### Erreur 3: Type definition incorrecte
```typescript
// ❌ INCORRECT
data: Omit<Prisma.RegionCreateInput, "tenant">

// ✅ CORRECT
data: Omit<Prisma.RegionCreateInput, "Tenant">
```

## 📁 Fichiers Critiques à Vérifier

Lors de toute modification, vérifier ces fichiers :

### Repositories (src/repositories/)
- `region.repository.ts` ✅
- `agriculteur.repository.ts` ✅
- `user.repository.ts` ✅
- `role.repository.ts` ✅
- Tous les autres repositories à venir

### Services (src/services/)
- `region.service.ts` ✅
- `agriculteur.service.ts` ✅
- Tous les autres services

### Helpers Tenant (src/lib/tenant/)
- `get-tenant.ts` ✅

### Actions Auth (src/actions/auth/)
- `select-wakala.action.ts` ✅

## 🛠️ Commande de Vérification Rapide

Pour trouver les relations incorrectes (lowercase) :

```bash
# Chercher 'tenant:' (devrait être 'Tenant:')
grep -r "tenant:" --include="*.ts" src/

# Chercher 'region:' (devrait être 'Region:')
grep -r "region:" --include="*.ts" src/

# Chercher 'role:' (devrait être 'Role:')
grep -r "role:" --include="*.ts" src/
```

## ✅ Statut des Corrections (02/07/2026)

### Fichiers Corrigés
- ✅ `src/lib/tenant/get-tenant.ts` - Corrigé `tenant` → `Tenant`, `role` → `Role`
- ✅ `src/repositories/region.repository.ts` - Corrigé `tenant` → `Tenant`
- ✅ `src/repositories/agriculteur.repository.ts` - Corrigé `tenant` → `Tenant`, `region` → `Region`
- ✅ `src/actions/auth/select-wakala.action.ts` - Corrigé `tenant` → `Tenant`, `role` → `Role`
- ✅ `src/services/agriculteur.service.ts` - Corrigé `region` → `Region` + ajout `tenantId` partout

### À Vérifier
- ⚠️ Tous les autres repositories (TypeDate, TypeCaisse, Client, Livraison, etc.)
- ⚠️ Tous les autres services
- ⚠️ Toutes les actions

## 🎯 Règle Mnémotechnique

> **"Dans Prisma, les Relations sont des Noms Propres - donc Majuscules"**

Si vous voyez `model Region` dans le schéma, utilisez `Region:` dans le code.
Si vous voyez `agriculteur Agriculteur @relation`, utilisez `Agriculteur:` dans le code.

---

**Dernière mise à jour:** 02/07/2026
**Statut:** Convention établie et appliquée aux modules Region et Agriculteur
