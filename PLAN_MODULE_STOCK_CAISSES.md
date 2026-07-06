# Plan Module Gestion Stock Caisses - 05/07/2026

## 🎯 Objectif

Créer un module complet pour gérer le stock de caisses et les prêts aux agriculteurs avec suivi automatique des retours.

---

## 📊 Modifications de la Base de Données

### 1. Ajout du champ `stockDisponible` dans TypeCaisse

```prisma
model TypeCaisse {
  id                  String                @id
  nom                 String
  poidsKg             Float
  stockDisponible     Int                   @default(0)  // NOUVEAU
  createdAt           DateTime              @default(now())
  updatedAt           DateTime
  tenantId            String
  // ... relations existantes
}
```

### 2. Modèle PretCaisse (déjà existant - à vérifier)

```prisma
model PretCaisse {
  id             String      @id
  nombrePrete    Int         // Nombre total prêté
  nombreRetourne Int         @default(0)  // Nombre déjà retourné
  statut         StatutPret  @default(EN_COURS)  // EN_COURS, RETOURNE, INCOMPLET
  datePreT       DateTime    @default(now())
  dateRetour     DateTime?   // Date de retour complet
  observations   String?
  agriculteurId  String
  typeCaisseId   String
  livraisonId    String?     // Optionnel - pour lier à une livraison
  createdById    String
  createdAt      DateTime    @default(now())
  updatedAt      DateTime
  tenantId       String
}

enum StatutPret {
  EN_COURS     // Prêt en cours
  RETOURNE     // Toutes les caisses retournées
  INCOMPLET    // Prêt avec retour partiel
}
```

---

## 🔧 Architecture Backend

### 1. Migration SQL
**Fichier**: `prisma/migrations/add_stock_caisses.sql`
```sql
-- Ajouter stockDisponible à TypeCaisse
ALTER TABLE "TypeCaisse" ADD COLUMN "stockDisponible" INTEGER NOT NULL DEFAULT 0;
```

### 2. Repository
**Fichier**: `src/repositories/pret-caisse.repository.ts`

**Méthodes**:
- `findAll(tenantId)` - Liste tous les prêts
- `findById(id, tenantId)` - Récupérer un prêt
- `findByAgriculteur(agriculteurId, tenantId)` - Prêts d'un agriculteur
- `findPretEnCours(agriculteurId, tenantId)` - Prêts en cours uniquement
- `create(data, tenantId)` - Créer un prêt
- `retournerCaisses(pretId, nombreRetourne, tenantId)` - Enregistrer un retour
- `getStatistiques(tenantId)` - Stats globales

### 3. Service
**Fichier**: `src/services/pret-caisse.service.ts`

**Logique métier**:
- Vérifier le stock disponible avant prêt
- Déduire du stock lors du prêt
- Ajouter au stock lors du retour
- Calculer automatiquement `nombreRestant = nombrePrete - nombreRetourne`
- Mettre à jour le statut (EN_COURS → RETOURNE)
- Vérifier les permissions RBAC
- Logger dans audit

### 4. Actions
**Fichiers**:
- `src/actions/prets-caisses/create-pret.action.ts`
- `src/actions/prets-caisses/retourner-caisses.action.ts`
- `src/actions/prets-caisses/get-prets.action.ts`
- `src/actions/prets-caisses/get-prets-agriculteur.action.ts`

### 5. Validators
**Fichier**: `src/validators/pret-caisse.validator.ts`

```typescript
createPretSchema: {
  agriculteurId: string,
  typeCaisseId: string,
  nombrePrete: number (min: 1),
  observations?: string,
  livraisonId?: string
}

retourSchema: {
  pretId: string,
  nombreRetourne: number (min: 1),
  observations?: string
}
```

---

## 🎨 Architecture Frontend

### 1. Page Principale
**Route**: `/dashboard/stock-caisses`
**Fichier**: `src/app/(dashboard)/dashboard/stock-caisses/page.tsx`

**Sections**:
1. **Stats en haut**:
   - Total stock disponible
   - Total prêté en cours
   - Nombre d'agriculteurs avec prêts

2. **Tableau des stocks par type de caisse**:
   - Nom du type
   - Poids unitaire
   - Stock disponible
   - Nombre prêté
   - Actions (Prêter)

3. **Tableau des prêts en cours**:
   - Agriculteur
   - Type de caisse
   - Nombre prêté
   - Nombre retourné
   - Restant
   - Statut
   - Actions (Retourner)

### 2. Dialogs

#### CreatePretDialog
- Select agriculteur
- Select type de caisse
- Input nombre (avec max = stock disponible)
- Textarea observations
- Select livraison (optionnel)

#### RetourDialog
- Affichage: Agriculteur + Type de caisse
- Info: Prêté / Déjà retourné / Restant
- Input nombre à retourner (max = restant)
- Textarea observations

### 3. Page Détails Agriculteur
**Route**: `/dashboard/agriculteurs/[id]/prets`
**Fichier**: `src/app/(dashboard)/dashboard/agriculteurs/[id]/prets/page.tsx`

**Contenu**:
- Résumé des prêts de l'agriculteur
- Historique complet des prêts
- Bouton "Nouveau Prêt"
- Bouton "Retourner" pour chaque prêt en cours

---

## 🔄 Flux Métier

### Flux 1: Prêt de Caisses

```
1. Agent ouvre "Prêter des caisses"
2. Sélectionne agriculteur
3. Sélectionne type de caisse
4. Système affiche stock disponible
5. Saisit nombre (≤ stock disponible)
6. Validation
7. Système:
   - Crée PretCaisse (statut: EN_COURS)
   - Déduit du stockDisponible
   - Log audit
8. Confirmation
```

### Flux 2: Retour de Caisses

```
1. Agent ouvre page agriculteur OU liste prêts
2. Clique "Retourner" sur un prêt EN_COURS
3. Système affiche:
   - Prêté: X
   - Déjà retourné: Y
   - Restant: Z = X - Y
4. Agent saisit nombre à retourner (≤ Z)
5. Validation
6. Système:
   - Met à jour nombreRetourne += saisi
   - Ajoute au stockDisponible
   - Si nombreRetourne == nombrePrete:
     * statut = RETOURNE
     * dateRetour = now()
   - Sinon:
     * statut reste EN_COURS
   - Log audit
7. Confirmation
```

### Flux 3: Consultation lors d'une Livraison

```
1. Agent enregistre une livraison
2. Système affiche automatiquement pour cet agriculteur:
   - Total prêté: X caisses
   - Déjà retourné: Y caisses
   - Restant: Z caisses
3. Agent peut cliquer "Retourner maintenant"
4. Déclenche le flux de retour
```

---

## 📋 Permissions RBAC

```typescript
"pret-caisse:read"   // ADMIN, AGENT, RESPONSABLE_STOCK, DIRECTION
"pret-caisse:create" // ADMIN, AGENT, RESPONSABLE_STOCK
"pret-caisse:update" // ADMIN, AGENT, RESPONSABLE_STOCK
"pret-caisse:delete" // ADMIN only
"stock:read"         // ADMIN, AGENT, RESPONSABLE_STOCK, DIRECTION
"stock:update"       // ADMIN, RESPONSABLE_STOCK
```

---

## 🌐 Traductions

### Français
```json
{
  "stockCaisses": {
    "title": "Stock de Caisses",
    "description": "Gestion du stock et des prêts de caisses",
    "stockDisponible": "Stock Disponible",
    "totalPrete": "Total Prêté",
    "nombrePrete": "Nombre Prêté",
    "nombreRetourne": "Nombre Retourné",
    "nombreRestant": "Restant",
    "preterCaisses": "Prêter des Caisses",
    "retournerCaisses": "Retourner des Caisses",
    "statut": "Statut",
    "enCours": "En Cours",
    "retourne": "Retourné",
    "incomplet": "Incomplet"
  }
}
```

---

## 📊 Calculs Automatiques

### Stock disponible après prêt:
```typescript
nouveauStock = stockActuel - nombrePrete
```

### Stock disponible après retour:
```typescript
nouveauStock = stockActuel + nombreRetourne
```

### Nombre restant à retourner:
```typescript
nombreRestant = nombrePrete - nombreRetourne
```

### Statut automatique:
```typescript
if (nombreRetourne === nombrePrete) {
  statut = "RETOURNE"
  dateRetour = new Date()
} else if (nombreRetourne > 0) {
  statut = "EN_COURS" // ou "INCOMPLET" selon logique
}
```

---

## 🧪 Tests à Effectuer

### Test 1: Prêt simple
1. ✅ Vérifier stock initial = 100
2. ✅ Prêter 20 caisses
3. ✅ Vérifier stock = 80
4. ✅ Vérifier prêt créé (statut: EN_COURS)

### Test 2: Retour complet
1. ✅ Retourner 20 caisses (toutes)
2. ✅ Vérifier stock = 100
3. ✅ Vérifier statut = RETOURNE
4. ✅ Vérifier dateRetour remplie

### Test 3: Retour partiel
1. ✅ Prêter 20 caisses
2. ✅ Retourner 10 caisses
3. ✅ Vérifier stock = 90
4. ✅ Vérifier restant = 10
5. ✅ Retourner 10 caisses restantes
6. ✅ Vérifier statut = RETOURNE

### Test 4: Prêt impossible (stock insuffisant)
1. ✅ Stock = 5
2. ✅ Tenter de prêter 10
3. ✅ Erreur: "Stock insuffisant"

### Test 5: Multi-agriculteurs
1. ✅ Prêter 10 à Agriculteur A
2. ✅ Prêter 15 à Agriculteur B
3. ✅ Vérifier totaux corrects
4. ✅ Retourner 5 de A
5. ✅ Vérifier stocks corrects

---

## 🚀 Plan d'Implémentation

### Phase 1: Backend (1-2h)
1. ✅ Migration SQL - ajouter stockDisponible
2. ✅ Repository pret-caisse
3. ✅ Service avec logique métier
4. ✅ Validators
5. ✅ Actions
6. ✅ Tests unitaires

### Phase 2: Frontend - Structure (1h)
1. ✅ Page stock-caisses
2. ✅ Composants dialogs
3. ✅ Traductions
4. ✅ Routes

### Phase 3: Frontend - UI (1-2h)
1. ✅ Tableau stock par type
2. ✅ Tableau prêts en cours
3. ✅ CreatePretDialog
4. ✅ RetourDialog
5. ✅ Stats cards

### Phase 4: Intégration (30min)
1. ✅ Lier avec page agriculteurs
2. ✅ Affichage lors des livraisons
3. ✅ Tests end-to-end

### Phase 5: Documentation (30min)
1. ✅ Guide utilisateur
2. ✅ Documentation technique
3. ✅ Workflows

---

## 📝 Notes Importantes

### Règles de Gestion
- Un agriculteur peut avoir plusieurs prêts en cours
- Un prêt ne peut jamais être supprimé (intégrité historique)
- Le stock ne peut jamais être négatif
- Les retours partiels sont autorisés
- Un prêt RETOURNE ne peut plus être modifié

### Sécurité Multi-Tenant
- Tous les prêts sont isolés par tenantId
- Le stock est géré par tenant
- Impossible de prêter des caisses d'un autre tenant

### Audit
- Chaque prêt est logué (CREATE_PRET_CAISSE)
- Chaque retour est logué (RETOUR_PRET_CAISSE)
- Modifications du stock loguées

---

## ✅ Checklist Complète

### Backend
- [ ] Migration SQL
- [ ] Régénérer Prisma client
- [ ] Repository
- [ ] Service
- [ ] Validators
- [ ] Actions (create, retour, get)
- [ ] Tests

### Frontend
- [ ] Page principale
- [ ] CreatePretDialog
- [ ] RetourDialog
- [ ] Tableau stocks
- [ ] Tableau prêts
- [ ] Stats cards
- [ ] Traductions
- [ ] Integration agriculteurs

### Tests
- [ ] Prêt simple
- [ ] Retour complet
- [ ] Retour partiel
- [ ] Stock insuffisant
- [ ] Multi-agriculteurs
- [ ] Validation des données

### Documentation
- [ ] Guide utilisateur
- [ ] Documentation API
- [ ] Workflows

---

**Prêt à commencer l'implémentation!**
