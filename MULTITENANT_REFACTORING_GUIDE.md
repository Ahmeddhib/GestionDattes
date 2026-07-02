# Guide de Refactoring Multi-Tenant SaaS

## Vue d'ensemble

Ce guide décrit le refactoring de l'ERP existant vers une architecture Multi-Tenant SaaS Enterprise en utilisant une **base de données partagée** avec isolation par `tenantId`.

## Architecture Multi-Tenant

### Concept
- **1 Application** + **1 Base PostgreSQL**
- **Wakala (Agence) = Tenant**
- Isolation des données via `tenantId` sur chaque entité métier
- Aucune donnée ne doit être visible entre tenants

### Flux d'authentification

```
1. User Login (email/password)
   ↓
2. Récupération des Wakalas assignés à l'utilisateur
   ↓
3a. Si 1 Wakala → Redirection automatique /dashboard
3b. Si plusieurs Wakalas → Page de sélection /select-wakala
   ↓
4. Wakala sélectionnée → Stockée dans la session JWT
   ↓
5. Toutes les requêtes utilisent automatiquement le tenantId de la session
```

## Étapes du Refactoring

### Phase 1: Schéma Prisma Multi-Tenant ✅
- [x] Créer `schema-multitenant.prisma`
- [x] Ajouter modèles `Tenant`, `TenantUser`
- [x] Ajouter `tenantId` à toutes les entités métier
- [x] Mettre à jour les relations
- [x] Ajouter les index de performance

### Phase 2: Migration Base de Données
- [ ] Créer script de migration SQL
- [ ] Backup de la base existante
- [ ] Exécuter la migration
- [ ] Créer tenant par défaut
- [ ] Migrer les données existantes

### Phase 3: Authentification Multi-Tenant
- [ ] Mettre à jour `src/lib/auth.ts`
- [ ] Ajouter récupération des tenants dans JWT
- [ ] Créer helper `getTenantFromSession()`
- [ ] Créer page `/select-wakala`
- [ ] Créer composant `WakalaSelector`

### Phase 4: Architecture Orientée Fonctionnalités
```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── services/
│   │   └── actions/
│   ├── tenants/
│   │   ├── components/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── actions/
│   ├── users/
│   │   ├── components/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── validators/
│   │   └── actions/
│   ├── agriculteurs/
│   ├── regions/
│   ├── livraisons/
│   ├── laboratoire/
│   ├── stock/
│   └── ventes/
├── lib/
│   ├── tenant/
│   │   ├── tenant-context.ts
│   │   ├── tenant-repository-base.ts
│   │   └── tenant-middleware.ts
│   ├── auth.ts
│   └── prisma.ts
└── middleware.ts
```

### Phase 5: Tenant Context & Repository Base
- [ ] Créer `TenantContext` provider
- [ ] Créer classe `TenantRepositoryBase<T>`
- [ ] Implémenter auto-filtrage par `tenantId`
- [ ] Créer helpers de validation tenant

### Phase 6: Middleware de Sécurité
- [ ] Middleware de vérification tenant
- [ ] Validation appartenance User ↔ Tenant
- [ ] Injection automatique du tenantId
- [ ] Protection des routes

### Phase 7: Mise à Jour des Repositories
- [ ] Étendre `TenantRepositoryBase`
- [ ] Ajouter filtrage automatique `tenantId`
- [ ] Mettre à jour toutes les requêtes
- [ ] Ajouter index de performance

### Phase 8: Mise à Jour des Services
- [ ] Passer le `tenantId` depuis la session
- [ ] Valider l'appartenance au tenant
- [ ] Mettre à jour les logs d'audit

### Phase 9: Mise à Jour des Server Actions
- [ ] Récupérer `tenantId` depuis la session
- [ ] Ne JAMAIS faire confiance au `tenantId` client
- [ ] Valider avant chaque opération

### Phase 10: UI Multi-Tenant
- [ ] Créer `WakalaSwitcher` dans TopBar
- [ ] Afficher Wakala courante
- [ ] Permettre changement de Wakala
- [ ] Mettre à jour tous les composants

### Phase 11: Tests & Validation
- [ ] Tester isolation des données
- [ ] Vérifier les permissions
- [ ] Tester le changement de tenant
- [ ] Audit de sécurité

### Phase 12: Performance & Production
- [ ] Optimiser les requêtes
- [ ] Vérifier les index
- [ ] Cache par tenant
- [ ] Documentation finale

## Fichiers Clés à Modifier

### Authentification
- `src/lib/auth.ts` - JWT avec tenantId
- `src/app/(auth)/login/LoginPageContent.tsx` - Post-login flow
- `src/app/(auth)/select-wakala/page.tsx` - ✨ NOUVEAU

### Infrastructure Tenant
- `src/lib/tenant/tenant-context.ts` - ✨ NOUVEAU
- `src/lib/tenant/tenant-repository-base.ts` - ✨ NOUVEAU
- `src/lib/tenant/get-tenant.ts` - ✨ NOUVEAU
- `src/middleware.ts` - Mise à jour

### Repositories (tous)
- `src/repositories/*.repository.ts` - Ajouter filtrage tenantId

### Services (tous)
- `src/services/*.service.ts` - Utiliser tenantId de session

### Actions (toutes)
- `src/actions/**/*.action.ts` - Valider tenantId

### UI Partagée
- `src/components/shared/TopBar.tsx` - Afficher Wakala courante
- `src/components/shared/WakalaSwitcher.tsx` - ✨ NOUVEAU

## Règles de Sécurité Critiques

### 🚨 JAMAIS faire confiance au `tenantId` du client
```typescript
// ❌ DANGER
async function deleteItem(tenantId: string, itemId: string) {
  // Le client peut envoyer n'importe quel tenantId !
}

// ✅ CORRECT
async function deleteItem(itemId: string) {
  const session = await auth();
  const tenantId = session?.user?.tenantId; // Depuis la session sécurisée
  if (!tenantId) throw new Error("No tenant");
  // ...
}
```

### 🔒 Toujours filtrer par tenantId
```typescript
// ❌ DANGER - Peut retourner des données d'autres tenants
const items = await prisma.agriculteur.findMany();

// ✅ CORRECT
const items = await prisma.agriculteur.findMany({
  where: { tenantId }
});
```

### 🛡️ Valider l'appartenance au tenant
```typescript
// Avant toute opération sensible
const tenantUser = await prisma.tenantUser.findUnique({
  where: {
    userId_tenantId: {
      userId: session.user.id,
      tenantId: requestedTenantId
    }
  }
});

if (!tenantUser || !tenantUser.active) {
  throw new Error("Access denied");
}
```

## Exemples de Code

### Repository Multi-Tenant
```typescript
// src/lib/tenant/tenant-repository-base.ts
export class TenantRepositoryBase<T> {
  constructor(private model: any) {}

  async findMany(tenantId: string, options?: any) {
    return this.model.findMany({
      where: {
        tenantId,
        ...options?.where
      },
      ...options
    });
  }

  async findById(tenantId: string, id: string) {
    return this.model.findUnique({
      where: { 
        id,
        tenantId // Double vérification
      }
    });
  }

  async create(tenantId: string, data: any) {
    return this.model.create({
      data: {
        ...data,
        tenantId // Injection automatique
      }
    });
  }
}
```

### Service Multi-Tenant
```typescript
// src/services/agriculteur.service.ts
export const agriculteurService = {
  async getAll(tenantId: string, options?: any) {
    // Valider que tenantId vient de la session
    return agriculteurRepository.findAll(tenantId, options);
  },

  async create(tenantId: string, data: any) {
    // Le repository injectera automatiquement le tenantId
    return agriculteurRepository.create(tenantId, data);
  }
};
```

### Server Action Multi-Tenant
```typescript
// src/actions/agriculteurs/create-agriculteur.action.ts
"use server";

import { auth } from "@/lib/auth";
import { getTenantFromSession } from "@/lib/tenant/get-tenant";

export async function createAgriculteurAction(formData: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Non authentifié" };
  }

  // Récupérer le tenant depuis la session (sécurisé)
  const tenantId = getTenantFromSession(session);
  if (!tenantId) {
    return { error: "Aucun tenant sélectionné" };
  }

  // Valider les données
  const parsed = validator.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error };
  }

  // Appeler le service avec le tenantId de la session
  try {
    const data = await agriculteurService.create(tenantId, parsed.data);
    revalidatePath("/dashboard/agriculteurs");
    return { data };
  } catch (error) {
    return { error: error.message };
  }
}
```

## Checklist de Validation

### Sécurité
- [ ] Aucune requête ne lit/écrit sans filtrage `tenantId`
- [ ] `tenantId` provient TOUJOURS de la session
- [ ] Middleware valide l'appartenance User ↔ Tenant
- [ ] Tests d'isolation entre tenants

### Performance
- [ ] Index sur `tenantId` pour toutes les tables
- [ ] Index composites `(tenantId, xxx)` optimisés
- [ ] Requêtes N+1 évitées
- [ ] Cache par tenant activé

### Fonctionnel
- [ ] Login → Sélection Wakala → Dashboard fonctionne
- [ ] Changement de Wakala fonctionne
- [ ] Affichage Wakala courante dans UI
- [ ] Toutes les pages respectent le tenant

### UX
- [ ] Sélecteur Wakala intuitif
- [ ] Nom Wakala visible en permanence
- [ ] Changement Wakala fluide
- [ ] Messages d'erreur clairs

## Ordre d'Exécution Recommandé

1. **Backup base de données** ⚠️
2. Migration Prisma schema
3. Seed tenant par défaut
4. Mise à jour auth + session
5. Création infrastructure tenant (context, base, helpers)
6. Mise à jour repositories un par un
7. Mise à jour services
8. Mise à jour actions
9. UI multi-tenant
10. Tests exhaustifs
11. Production

## Commandes Utiles

```bash
# Backup base de données
pg_dump $DATABASE_URL > backup_before_multitenant.sql

# Générer client Prisma
bunx prisma generate --schema=prisma/schema-multitenant.prisma

# Créer migration
bunx prisma migrate dev --name add_multi_tenant --schema=prisma/schema-multitenant.prisma

# Seed données
bunx tsx prisma/seed.ts

# Vérifier structure
bunx prisma studio --schema=prisma/schema-multitenant.prisma
```

## Notes Importantes

### Compatibilité Ascendante
- Garder les pages existantes
- Réutiliser les composants UI
- Minimiser les changements de routes
- Migration progressive possible

### Données Existantes
- Créer 1 tenant par défaut ("Wakala Principale")
- Assigner `tenantId` à toutes les données existantes
- Créer TenantUser pour tous les users existants
- Vérifier l'intégrité après migration

### Rollback
- Garder `schema.prisma` original
- Backup avant migration
- Script de rollback préparé
- Test sur environnement de staging d'abord

---

**Prochaines étapes**: Commencer par la Phase 2 (Migration) puis Phase 3 (Auth)
