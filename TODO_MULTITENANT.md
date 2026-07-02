# 📋 TODO Multi-Tenant - Tâches Restantes

**Date:** 2 juillet 2026  
**Priorité:** HAUTE → MOYENNE → BASSE

---

## 🔴 PRIORITÉ HAUTE - À faire immédiatement

### 1. Service Agriculteur (30 min)
**Fichier:** `src/services/agriculteur.service.ts`

**Tâche:** Mettre à jour toutes les méthodes avec `tenantId`

**Pattern à suivre:**
```typescript
// AVANT
async getAll(userId: string) {
    await requirePermission("agriculteur:read");
    return agriculteurRepository.findAll();
}

// APRÈS
async getAll(tenantId: string, userId: string) {
    await requirePermission("agriculteur:read");
    return agriculteurRepository.findAll(tenantId);
}
```

**Méthodes à modifier:**
- `getAll(tenantId, userId)`
- `getById(tenantId, userId, id)`
- `getByRegion(tenantId, userId, regionId)`
- `create(tenantId, userId, data)`
- `update(tenantId, userId, data)`
- `delete(tenantId, userId, id)`

**Vérifications:**
- Passer `tenantId` à `agriculteurRepository.*`
- Passer `tenantId` à `regionRepository.findById()` 
- Passer `tenantId` à `auditService.log()`
- Messages d'erreur: "... dans cette Wakala"

---

### 2. Middleware de Protection (20 min)
**Fichier:** `src/middleware.ts` (À créer)

**Objectif:** Protéger les routes dashboard

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const session = await auth();
    
    // Routes dashboard: exiger tenantId
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
        if (!session?.user?.tenantId) {
            // Pas de Wakala sélectionnée → Rediriger vers accueil
            return NextResponse.redirect(new URL("/", request.url));
        }
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        // Ajouter d'autres routes protégées
    ],
};
```

**Test:**
- Accéder `/dashboard` sans login → Redirect `/`
- Accéder `/dashboard` avec login sans tenantId → Redirect `/`
- Accéder `/dashboard` avec login + tenantId → OK

---

### 3. Tests Isolation Données (1h)
**Objectif:** Vérifier qu'aucune fuite n'existe

**Scénario de test:**
1. Créer 2 Wakalas de test
2. Dans Wakala A: créer région "Test A"
3. Dans Wakala B: créer région "Test B"
4. Se connecter à Wakala A → Voir uniquement "Test A"
5. Se connecter à Wakala B → Voir uniquement "Test B"

**À tester:**
- ✅ Régions isolées
- ✅ Agriculteurs isolés
- 🔄 Type Dates isolés
- 🔄 Type Caisses isolés
- 🔄 Clients isolés
- 🔄 Livraisons isolées
- 🔄 Stock isolé

**Si problème:**
- Vérifier repository filtre par `tenantId`
- Vérifier service passe `tenantId`
- Vérifier action utilise `getTenantId()`

---

## 🟡 PRIORITÉ MOYENNE - Dans les 2-3 prochains jours

### 4. Type Dates - Actions & Service (1h)

**Actions à créer/modifier (4 fichiers):**
- `src/actions/type-dates/get-type-dates.action.ts`
- `src/actions/type-dates/create-type-date.action.ts`
- `src/actions/type-dates/update-type-date.action.ts`
- `src/actions/type-dates/delete-type-date.action.ts`

**Service à modifier:**
- `src/services/type-date.service.ts`

**Repository à créer:**
- `src/repositories/type-date.repository.ts` (multi-tenant)

**Pattern:**
```typescript
// Action
const tenantId = await getTenantId();
await typeDateService.getAll(tenantId, session.user.id);

// Service
async getAll(tenantId: string, userId: string) {
    await requirePermission("type-date:read");
    return typeDateRepository.findAll(tenantId);
}

// Repository
async findAll(tenantId: string) {
    return prisma.typeDate.findMany({
        where: { tenantId },
        orderBy: { nom: "asc" },
    });
}
```

---

### 5. Type Caisses - Actions & Service (1h)

**Même structure que Type Dates:**
- 4 actions (get, create, update, delete)
- 1 service
- 1 repository multi-tenant

**Fichiers:**
- `src/actions/type-caisses/*`
- `src/services/type-caisse.service.ts`
- `src/repositories/type-caisse.repository.ts`

---

### 6. Clients - Actions & Service (1h)

**Fichiers:**
- `src/actions/clients/*`
- `src/services/client.service.ts`
- `src/repositories/client.repository.ts`

**Spécificités:**
- Vérifier isolation des clients par tenant
- Codes clients uniques par tenant

---

### 7. WakalaSwitcher dans TopBar (30 min)
**Fichier:** `src/components/shared/WakalaSwitcher.tsx` (Déjà créé?)

**Objectif:** Permettre switch rapide entre Wakalas

**Fonctionnalités:**
```typescript
// 1. Récupérer les Wakalas de l'utilisateur
const wakalas = await fetch(`/api/tenants/user/${userId}`);

// 2. Afficher dropdown
<Select value={currentTenantId} onValueChange={handleSwitch}>
  {wakalas.map(w => (
    <SelectItem key={w.id} value={w.id}>
      {w.name} ({w.code})
    </SelectItem>
  ))}
</Select>

// 3. Switch
async function handleSwitch(newTenantId: string) {
    // Update session
    await update({ tenantId: newTenantId });
    // Refresh
    router.refresh();
}
```

**Intégration:**
- Ajouter dans `TopBar.tsx` à côté du LanguageSwitcher

---

### 8. Service Audit avec tenantId (30 min)
**Fichier:** `src/services/audit.service.ts`

**Modifications:**
```typescript
// AVANT
async log({ actorId, action, targetId, description, details }) {
    await prisma.auditLog.create({
        data: { actorId, action, targetId, description, details },
    });
}

// APRÈS
async log({ tenantId, actorId, action, targetId, description, details }) {
    await prisma.auditLog.create({
        data: {
            tenantId, // IMPORTANT pour filtrage
            actorId,
            action,
            targetId,
            description,
            details,
        },
    });
}
```

**Impact:**
- Mettre à jour TOUS les appels à `auditService.log()`
- Ajouter `tenantId` en premier paramètre

---

## 🟢 PRIORITÉ BASSE - Quand le temps le permet

### 9. Livraisons - Actions & Service (2h)

**Complexité:** Moyenne (relations multiples)

**Fichiers:**
- `src/actions/livraisons/*`
- `src/services/livraison.service.ts`
- `src/repositories/livraison.repository.ts`

**Vérifications:**
- Agriculteur du même tenant
- Type Date du même tenant
- Type Caisse du même tenant

---

### 10. Stock - Actions & Service (2h)

**Complexité:** Moyenne

**Fichiers:**
- `src/actions/stock/*`
- `src/services/stock.service.ts`
- `src/repositories/stock.repository.ts`

---

### 11. Ventes - Actions & Service (2h)

**Complexité:** Moyenne

**Fichiers:**
- `src/actions/ventes/*`
- `src/services/vente.service.ts`
- `src/repositories/vente.repository.ts`

**Vérifications:**
- Client du même tenant
- Stock du même tenant

---

### 12. Dashboard avec Stats par Tenant (3h)

**Objectif:** Afficher statistiques filtrées par tenant

**Métriques:**
```typescript
const stats = {
    totalAgriculteurs: await agriculteurRepo.count(tenantId),
    totalLivraisons: await livraisonRepo.count(tenantId),
    stockTotal: await stockRepo.sum(tenantId, 'quantite'),
    ventesTotales: await venteRepo.sum(tenantId, 'montant'),
};
```

**Graphiques:**
- Évolution livraisons (par tenant)
- Top agriculteurs (par tenant)
- Stock par type dattes (par tenant)

---

### 13. Notifications par Tenant (2h)

**Objectif:** Notifications isolées par tenant

**Tables:**
- `Notification` doit avoir `tenantId`

**Fonctionnalités:**
- Créer notification pour un tenant
- Marquer comme lue (vérifier appartenance)
- Liste notifications du tenant uniquement

---

### 14. Utilisateurs Multi-Wakalas (3h)

**Objectif:** Un user peut appartenir à plusieurs Wakalas

**Déjà implémenté:**
- Table `TenantUser` avec relations multiples ✅

**À faire:**
- Page "Mes Wakalas" listant toutes les Wakalas d'un user
- Assigner un utilisateur à plusieurs Wakalas (ADMIN)
- Gérer les rôles différents par Wakala

**Exemple:**
```typescript
// User X peut être:
// - ADMIN dans Wakala A
// - AGENT dans Wakala B
// - DIRECTION dans Wakala C
```

---

### 15. Tests Automatisés (5h)

**Tests E2E avec Playwright:**
```typescript
test("Isolation des données entre tenants", async ({ page }) => {
    // Login Wakala A
    await page.goto("/");
    await page.click(`[data-wakala-id="wakala-a"]`);
    await page.fill("#email", "admin@a.wakala");
    await page.fill("#password", "Admin@123");
    await page.click('button[type="submit"]');
    
    // Créer région
    await page.goto("/dashboard/regions");
    await page.click("text=Nouvelle Région");
    await page.fill("#nom", "Region A");
    await page.click("text=Créer");
    
    // Logout
    await page.click("text=Déconnexion");
    
    // Login Wakala B
    await page.goto("/");
    await page.click(`[data-wakala-id="wakala-b"]`);
    await page.fill("#email", "admin@b.wakala");
    await page.fill("#password", "Admin@123");
    await page.click('button[type="submit"]');
    
    // Vérifier région A invisible
    await page.goto("/dashboard/regions");
    const regions = await page.locator('table tbody tr').count();
    expect(regions).toBe(0); // Aucune région visible
});
```

**Tests unitaires:**
- Repositories: vérifier filtrage tenantId
- Services: vérifier passage tenantId
- Actions: vérifier récupération tenantId

---

### 16. Documentation API (2h)

**Objectif:** Documenter toutes les API routes

**Fichiers:**
- `API_DOCUMENTATION.md`

**Contenu:**
```markdown
# API Routes

## Tenants

### GET /api/tenants/user/[userId]
Liste les Wakalas d'un utilisateur

**Parameters:**
- `userId` (path) - ID de l'utilisateur

**Response:**
```json
{
  "tenants": [
    {
      "id": "xxx",
      "name": "Wakala Nord",
      "code": "TUN-NORD",
      "role": "ADMIN"
    }
  ]
}
```
```

---

## 📊 Estimation Temps Total

| Catégorie | Tâches | Temps Estimé |
|-----------|--------|--------------|
| **Priorité HAUTE** | 1-3 | 2h |
| **Priorité MOYENNE** | 4-8 | 5-6h |
| **Priorité BASSE** | 9-16 | 20-25h |
| **TOTAL** | 16 tâches | **27-33h** |

---

## 🎯 Sprint Planning Suggéré

### Sprint 1 (Jour 1-2): Core Multi-Tenant
- ✅ Service Agriculteur
- ✅ Middleware Protection
- ✅ Tests Isolation

### Sprint 2 (Jour 3-4): Modules de Base
- ✅ Type Dates (actions + service + repo)
- ✅ Type Caisses (actions + service + repo)
- ✅ Clients (actions + service + repo)

### Sprint 3 (Jour 5-7): Modules Avancés
- ✅ Livraisons
- ✅ Stock
- ✅ Ventes

### Sprint 4 (Jour 8-10): Features & Polish
- ✅ WakalaSwitcher
- ✅ Dashboard Stats
- ✅ Notifications
- ✅ Users Multi-Wakalas

### Sprint 5 (Jour 11-12): Tests & Doc
- ✅ Tests E2E
- ✅ Tests Unitaires
- ✅ Documentation API

---

## ✅ Checklist par Tâche

Pour chaque module à convertir:

### Repository
- [ ] Ajouter `tenantId` à `findAll()`
- [ ] Ajouter double vérification dans `findById()`
- [ ] Ajouter `tenantId` à `create()`
- [ ] Vérifier appartenance dans `update()`
- [ ] Vérifier appartenance dans `delete()`
- [ ] Filtrer comptages par `tenantId`

### Service
- [ ] Ajouter `tenantId` en premier paramètre
- [ ] Passer `tenantId` au repository
- [ ] Passer `tenantId` à auditService
- [ ] Vérifier unicité codes/CIN par tenant
- [ ] Messages d'erreur mentionnent "Wakala"

### Actions
- [ ] Import `getTenantId`
- [ ] Appeler `const tenantId = await getTenantId()`
- [ ] Passer `tenantId` au service
- [ ] Gestion d'erreurs appropriée

### Tests
- [ ] Test isolation données
- [ ] Test CRUD basique
- [ ] Test codes/CIN uniques par tenant
- [ ] Test associations (ex: région du même tenant)

---

**Prochaine étape immédiate:** Service Agriculteur (30 min) 🚀
