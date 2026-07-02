# Multi-Tenant: Prochaines Étapes

## 🎯 Vous êtes ici

✅ **Phase 1-3 TERMINÉES**: Infrastructure multi-tenant créée
- Schema Prisma multi-tenant prêt
- Script de migration SQL prêt
- Helpers tenant créés
- Auth multi-tenant configurée
- UI de sélection Wakala créée
- Exemple repository multi-tenant créé

## 🚀 Comment Continuer

### Option A: Migration Immédiate (Recommandé pour Dev)

Si vous êtes sur un environnement de **développement** et voulez tester immédiatement:

```bash
# 1. BACKUP (OBLIGATOIRE!)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Remplacer le schema
cp prisma/schema-multitenant.prisma prisma/schema.prisma

# 3. Regénérer client Prisma
bunx prisma generate

# 4. Exécuter la migration SQL
# Méthode 1: Via psql
psql $DATABASE_URL < prisma/migrations/add_multitenant/migration.sql

# Méthode 2: Via Prisma migrate
bunx prisma migrate dev --name add_multi_tenant

# 5. Vérifier que tout fonctionne
bunx prisma studio

# 6. Tester le login
bun run dev
```

### Option B: Migration Progressive (Recommandé pour Production)

Si vous voulez **tester d'abord** avant de migrer:

#### Étape 1: Test sur Base Vide
```bash
# Créer une base de test
createdb gestion_dattes_multitenant_test

# Mettre à jour .env temporairement
DATABASE_URL="postgresql://user:pass@localhost/gestion_dattes_multitenant_test"

# Appliquer le nouveau schema
cp prisma/schema-multitenant.prisma prisma/schema.prisma
bunx prisma migrate dev --name init_multitenant

# Tester
bun run dev
```

#### Étape 2: Migration Données Existantes
Une fois validé sur base de test:
```bash
# Revenir à la base principale
# Exécuter le script de migration SQL
psql $DATABASE_URL < prisma/migrations/add_multitenant/migration.sql
```

## 📝 Après la Migration DB

### 1. Vérifier les Données
```sql
-- Vérifier que le tenant par défaut existe
SELECT * FROM "Tenant";

-- Vérifier que tous les users ont un TenantUser
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "TenantUser";

-- Vérifier que toutes les données ont un tenantId
SELECT COUNT(*) FROM "Agriculteur" WHERE "tenantId" IS NULL;
SELECT COUNT(*) FROM "Region" WHERE "tenantId" IS NULL;
SELECT COUNT(*) FROM "Livraison" WHERE "tenantId" IS NULL;
```

### 2. Mettre à Jour les Repositories

Utiliser `agriculteur.repository.multitenant.ts` comme modèle:

```typescript
// Pattern à appliquer partout
export const xxxRepository = {
  async findAll(tenantId: string) {
    return prisma.xxx.findMany({
      where: { tenantId }, // OBLIGATOIRE
      // ...
    });
  },
  
  async findById(tenantId: string, id: string) {
    return prisma.xxx.findFirst({
      where: { id, tenantId }, // Double vérification
      // ...
    });
  },
  
  async create(tenantId: string, data: any) {
    return prisma.xxx.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } }, // Injection
      },
    });
  },
};
```

Fichiers à mettre à jour:
- [ ] `src/repositories/region.repository.ts`
- [ ] `src/repositories/user.repository.ts`
- [ ] `src/repositories/audit.repository.ts`
- [ ] etc.

### 3. Mettre à Jour les Services

```typescript
// Pattern à appliquer partout
import { getTenantId } from "@/lib/tenant/get-tenant";

export const xxxService = {
  async getAll(options?: any) {
    const tenantId = await getTenantId(); // Depuis session
    return xxxRepository.findAll(tenantId, options);
  },
  
  async create(data: any) {
    const tenantId = await getTenantId(); // Depuis session
    return xxxRepository.create(tenantId, data);
  },
};
```

### 4. Mettre à Jour les Actions

```typescript
// Pattern à appliquer partout
"use server";

import { getTenantId } from "@/lib/tenant/get-tenant";

export async function createXxxAction(formData: unknown) {
  try {
    const tenantId = await getTenantId(); // JAMAIS du client!
    
    const parsed = validator.safeParse(formData);
    if (!parsed.success) {
      return { error: parsed.error };
    }
    
    const data = await xxxService.create(tenantId, parsed.data);
    revalidatePath("/dashboard/xxx");
    return { data };
  } catch (error) {
    return { error: error.message };
  }
}
```

### 5. Mettre à Jour le Login Flow

Dans `src/app/(auth)/login/LoginPageContent.tsx`, après login réussi:

```typescript
const result = await signIn("credentials", {
  email: data.email,
  password: data.password,
  redirect: false,
});

if (result?.ok) {
  // Récupérer les tenants de l'utilisateur
  const tenants = await getUserTenants(session.user.id);
  
  if (tenants.length === 0) {
    // Erreur: aucun tenant
    setError("Aucune Wakala assignée");
  } else if (tenants.length === 1) {
    // Auto-sélection
    await selectWakalaAction(tenants[0].id);
    router.push("/dashboard");
  } else {
    // Rediriger vers sélection
    router.push("/select-wakala");
  }
}
```

### 6. Créer Middleware de Protection

Dans `src/middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Protéger /dashboard/*
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    // Vérifier tenant sélectionné
    if (!session.user.tenantId) {
      return NextResponse.redirect(new URL("/select-wakala", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

## 🧪 Tests à Effectuer

### Test 1: Login et Sélection Wakala
1. Login avec un utilisateur
2. Vérifier affichage page sélection Wakala
3. Sélectionner une Wakala
4. Vérifier redirection vers dashboard
5. Vérifier affichage Wakala courante dans TopBar

### Test 2: Isolation des Données
1. Créer 2 tenants différents
2. Créer des agriculteurs dans chaque tenant
3. Se connecter avec user du tenant A
4. Vérifier que seules les données du tenant A sont visibles
5. Changer vers tenant B
6. Vérifier que les données ont changé

### Test 3: CRUD Multi-Tenant
Pour chaque module (agriculteurs, regions, etc.):
1. Créer un enregistrement
2. Vérifier qu'il a le bon tenantId
3. Lire les enregistrements
4. Mettre à jour
5. Supprimer
6. Vérifier que tout reste dans le bon tenant

### Test 4: Sécurité
1. Tenter d'accéder à /dashboard sans login → Redirigé vers /login
2. Tenter d'accéder à /dashboard sans tenant → Redirigé vers /select-wakala
3. Essayer de manipuler tenantId en client → Doit échouer

## 📚 Documentation Disponible

- `MULTITENANT_REFACTORING_GUIDE.md` - Guide complet du refactoring
- `MULTITENANT_IMPLEMENTATION_STATUS.md` - État d'avancement détaillé
- `MULTITENANT_NEXT_STEPS.md` - Ce document (prochaines étapes)
- `prisma/schema-multitenant.prisma` - Nouveau schema avec commentaires
- `prisma/migrations/add_multitenant/migration.sql` - Script de migration
- `src/lib/tenant/` - Helpers multi-tenant
- `src/repositories/agriculteur.repository.multitenant.ts` - Exemple repository

## ⚠️ Points d'Attention

### Ne PAS faire:
- ❌ Accepter `tenantId` depuis le client
- ❌ Oublier de filtrer par `tenantId` dans les queries
- ❌ Migrer en production sans tester
- ❌ Oublier le backup avant migration

### TOUJOURS faire:
- ✅ Récupérer `tenantId` depuis la session
- ✅ Filtrer TOUTES les queries par `tenantId`
- ✅ Vérifier l'appartenance User ↔ Tenant
- ✅ Backup avant migration
- ✅ Tester sur dev/staging d'abord

## 🆘 En Cas de Problème

### Rollback Base de Données
```bash
# Restaurer depuis le backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Revenir à l'ancien schema
git checkout HEAD -- prisma/schema.prisma
bunx prisma generate
```

### Debug
```typescript
// Vérifier session
const session = await auth();
console.log("Session:", session);
console.log("TenantId:", session?.user?.tenantId);

// Vérifier requête
console.log("Query WHERE:", { tenantId, ...otherConditions });
```

## 📞 Questions Fréquentes

**Q: Dois-je recréer toute l'application?**
R: Non! On garde tout et on ajoute le filtrage `tenantId`.

**Q: Les données existantes seront-elles perdues?**
R: Non! Elles seront assignées au tenant par défaut.

**Q: Puis-je tester sans tout casser?**
R: Oui! Tester d'abord sur une base de données de test (Option B).

**Q: Combien de temps ça prend?**
R: Migration DB: 5-10 min. Mise à jour code: 2-4h selon nombre de fichiers.

**Q: Puis-je migrer module par module?**
R: Oui, mais la base doit être migrée d'un coup. Le code peut être fait progressivement.

---

**Besoin d'aide?** Consultez les fichiers de documentation ou demandez assistance!
