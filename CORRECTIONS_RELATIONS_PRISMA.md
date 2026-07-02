# 🔧 Corrections Relations Prisma - Multi-Tenant

**Date:** 2 juillet 2026  
**Problème:** Noms de relations incorrects après migration multi-tenant

---

## 🐛 Problèmes Identifiés

### Contexte
Après la migration vers le schéma multi-tenant, Prisma utilise des **noms de relations avec majuscules** (ex: `Agriculteur`, `Role`, `Tenant`) mais le code ancien utilisait des minuscules (ex: `agriculteurs`, `role`, `tenant`).

### Impact
- ❌ Erreurs `Unknown field` sur toutes les pages
- ❌ Impossible de charger les listes (régions, users, roles)
- ❌ Comptages (`_count`) échouent

---

## ✅ Corrections Appliquées

### 1. Region Repository ✅

**Fichier:** `src/repositories/region.repository.ts`

**Problème:**
```typescript
_count: {
    select: {
        agriculteurs: true, // ❌ Incorrect
    },
}
```

**Solution:**
```typescript
_count: {
    select: {
        Agriculteur: true, // ✅ Correct (majuscule)
    },
}
```

**Méthodes corrigées:**
- `findAll()` - _count.Agriculteur
- `findById()` - _count.Agriculteur
- `create()` - _count.Agriculteur
- `update()` - _count.Agriculteur

---

### 2. User Repository ✅

**Fichier:** `src/repositories/user.repository.ts`

**Problème:**
```typescript
// User n'a PLUS de relation directe "role"
role: {
    select: { name: true }, // ❌ N'existe plus
}
```

**Solution:**
```typescript
// Les rôles sont maintenant via TenantUser
TenantUser: {
    select: {
        Role: {
            select: { name: true },
        },
        Tenant: {
            select: { name: true, code: true },
        },
    },
}
```

**Changements structurels:**
- ❌ Supprimé: `role` (relation directe)
- ✅ Ajouté: `TenantUser` (relation via tenant)
- ✅ Ajouté: `TenantUser.Role` (rôle par tenant)
- ✅ Ajouté: `TenantUser.Tenant` (info Wakala)

**Méthodes modifiées:**
- `findAll()` - Include TenantUser avec Role et Tenant
- `findById()` - Include TenantUser avec Role et Tenant
- `findByEmail()` - Include TenantUser avec Role
- `create()` - Supprimé roleId (pas de rôle global)
- `update()` - Supprimé roleId (pas de rôle global)

**Impact sur l'interface:**
Avant un utilisateur avait UN rôle global.
Maintenant un utilisateur peut avoir:
- Rôle ADMIN dans Wakala A
- Rôle AGENT dans Wakala B
- Rôle DIRECTION dans Wakala C

---

### 3. Role Repository ✅

**Fichier:** `src/repositories/role.repository.ts`

**Problème:**
```typescript
_count: {
    select: { users: true }, // ❌ N'existe plus
}
```

**Solution:**
```typescript
_count: {
    select: { TenantUser: true }, // ✅ Compte via TenantUser
}
```

**Explication:**
- Avant: `Role` → `User` (relation directe)
- Maintenant: `Role` → `TenantUser` → `User` (via tenant)

**Méthodes corrigées:**
- `findAll()` - _count.TenantUser
- `findById()` - _count.TenantUser

---

## 📊 Tableau Récapitulatif

| Modèle | Ancienne Relation | Nouvelle Relation | Type |
|--------|------------------|-------------------|------|
| **Region** | `agriculteurs` | `Agriculteur` | _count |
| **User** | `role` | `TenantUser.Role` | include |
| **Role** | `users` | `TenantUser` | _count |
| **TenantUser** | `role` | `Role` | include |
| **TenantUser** | `tenant` | `Tenant` | include |

---

## 🔍 Comment Identifier Ces Erreurs

### Symptôme 1: Unknown field
```
Unknown field `agriculteurs` for select statement on model `RegionCountOutputType`
```

**Solution:** Vérifier le schéma Prisma et utiliser le nom de relation exact (majuscule).

### Symptôme 2: Relation n'existe plus
```
Unknown field `role` for select statement on model `User`
```

**Solution:** La relation a changé avec le multi-tenant. Vérifier le nouveau schéma.

### Symptôme 3: Type Count incorrect
```
Unknown field `users` for select statement on model `RoleCountOutputType`
```

**Solution:** Compter via la nouvelle relation (ex: `TenantUser` au lieu de `users`).

---

## 🛠️ Méthode de Correction Systématique

### Étape 1: Identifier la Relation
```bash
# Ouvrir prisma/schema.prisma
# Chercher le modèle concerné
# Noter le NOM EXACT de la relation
```

### Étape 2: Vérifier dans le Schéma
```prisma
model Region {
  // ...
  Agriculteur Agriculteur[] // ← Nom de la relation: "Agriculteur"
}

model User {
  // ...
  TenantUser TenantUser[] // ← Nom de la relation: "TenantUser"
  // PAS de "role" !
}

model Role {
  // ...
  TenantUser TenantUser[] // ← Nom de la relation: "TenantUser"
  // PAS de "users" !
}
```

### Étape 3: Corriger le Code
```typescript
// ❌ AVANT (incorrect)
_count: { select: { agriculteurs: true } }

// ✅ APRÈS (correct)
_count: { select: { Agriculteur: true } }
```

### Étape 4: Vérifier les Includes
```typescript
// ❌ AVANT (n'existe plus)
include: { role: { select: { name: true } } }

// ✅ APRÈS (nouvelle structure)
include: {
    TenantUser: {
        select: {
            Role: { select: { name: true } },
            Tenant: { select: { name: true } },
        },
    },
}
```

---

## 📝 Checklist de Vérification

Après migration multi-tenant, vérifier TOUS les repositories:

### Pour chaque modèle:
- [ ] Les relations utilisent le nom EXACT du schéma (majuscules)
- [ ] Les `_count` utilisent les bons noms de relations
- [ ] Les `include` utilisent les bons noms de relations
- [ ] Les relations via junction tables sont correctes (ex: TenantUser)

### Cas spéciaux multi-tenant:
- [ ] User n'a plus de `role` direct → utiliser `TenantUser.Role`
- [ ] Role n'a plus de `users` → utiliser `TenantUser`
- [ ] Toutes les relations métier incluent `tenantId`

---

## 🎯 Bonne Pratique

### Toujours Vérifier le Schéma
Avant d'écrire une requête Prisma:

1. **Ouvrir** `prisma/schema.prisma`
2. **Trouver** le modèle concerné
3. **Copier** le nom EXACT de la relation
4. **Utiliser** ce nom dans le code

### Exemple:
```prisma
// Dans schema.prisma
model Region {
  Agriculteur Agriculteur[]
  //^^^^^^^^^ Copier ce nom exactement
}
```

```typescript
// Dans le code
_count: {
    select: {
        Agriculteur: true, // Coller ici
    },
}
```

---

## ⚠️ Autres Erreurs Communes

### 1. Typo dans le Nom
```typescript
❌ Agriculteurs (pluriel)
✅ Agriculteur (singulier)
```

### 2. Casse Incorrecte
```typescript
❌ agriculteur (minuscule)
✅ Agriculteur (majuscule)
```

### 3. Relation Obsolète
```typescript
❌ User.role (n'existe plus en multi-tenant)
✅ User.TenantUser.Role (via junction)
```

---

## 📚 Ressources

**Schéma Prisma:** `prisma/schema.prisma`  
**Documentation Prisma:** https://www.prisma.io/docs/concepts/components/prisma-schema/relations

**Fichiers Corrigés:**
- ✅ `src/repositories/region.repository.ts`
- ✅ `src/repositories/user.repository.ts`
- ✅ `src/repositories/role.repository.ts`

---

**Status:** ✅ Toutes les relations corrigées  
**Serveur:** ✅ Compile sans erreur  
**Tests:** 🔄 À effectuer pour validation
