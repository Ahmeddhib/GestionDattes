# Plan d'Implémentation Détaillé

## État actuel ✅

### Modules complétés (100%)
1. ✅ **Multi-tenant & Auth** - Tenant, User, Role, TenantUser, AuditLog
2. ✅ **Régions** - CRUD complet avec multi-tenant
3. ✅ **Agriculteurs** - CRUD complet avec relations
4. ✅ **Types de Caisses** - CRUD complet
5. ✅ **Types de Dattes** - CRUD complet

---

## Phase 1: Livraisons (MODULE PRIORITAIRE) 🚀

### 1.1 Livraison - Réception des dattes

#### Backend
**Validator** (`src/validators/livraison.validator.ts`)
```typescript
- CreateLivraisonInput
  - numeroLot: string (auto-généré)
  - agriculteurId: string (required)
  - typeDateId: string (required)
  - typeCaisseId: string (required)
  - nombreCaisses: number (required, min: 1)
  - observations?: string
  
- UpdateLivraisonInput
  - id: string
  - statut?: enum (EN_ATTENTE, PESEE_FAITE, ECHANTILLON_PRIS, ANALYSE_FAITE, VALIDEE)
  - observations?: string
```

**Repository** (`src/repositories/livraison.repository.ts`)
```typescript
- findAll(tenantId, filters?) → Liste avec agriculteur, typeDate, typeCaisse, counts
- findById(id, tenantId) → Détails complets
- findByNumeroLot(numeroLot, tenantId)
- create(tenantId, data)
- update(id, data, tenantId)
- delete(id, tenantId)
- generateNumeroLot(tenantId) → "LIV-2026-0001"
- getStatistics(tenantId) → Stats par statut
```

**Service** (`src/services/livraison.service.ts`)
```typescript
- getAll(tenantId, userId, filters?)
- getById(id, tenantId, userId)
- create(tenantId, userId, data)
- update(tenantId, userId, data)
- delete(tenantId, userId, id)
- updateStatut(tenantId, userId, id, statut)
- getStatistics(tenantId, userId)
```

**Actions** (`src/actions/livraisons/`)
- `get-livraisons.action.ts`
- `get-livraison-by-id.action.ts`
- `create-livraison.action.ts`
- `update-livraison.action.ts`
- `delete-livraison.action.ts`
- `update-statut-livraison.action.ts`

**Permissions** (`src/constants/permissions.ts`)
```typescript
"livraison:read": [ADMIN, AGENT, RESPONSABLE_STOCK, LABORANTIN, DIRECTION]
"livraison:create": [ADMIN, AGENT, RESPONSABLE_STOCK]
"livraison:update": [ADMIN, AGENT, RESPONSABLE_STOCK]
"livraison:delete": [ADMIN]
```

#### Frontend
**Pages** (`src/app/(dashboard)/dashboard/livraisons/`)
- `page.tsx` - Liste des livraisons
- `[id]/page.tsx` - Détails d'une livraison
- `LivraisonsPageContent.tsx` - Client component

**Composants** (`src/components/features/livraisons/`)
- `LivraisonsTableAdvanced.tsx` - Table avec filtres
- `columns.tsx` - Définition des colonnes
- `CreateLivraisonDialog.tsx` - Dialog de création
- `UpdateLivraisonDialog.tsx` - Dialog de modification
- `DeleteLivraisonDialog.tsx` - Dialog de suppression
- `LivraisonDetailsCard.tsx` - Card de détails
- `LivraisonStatusBadge.tsx` - Badge de statut

**Colonnes de la table**
- Numéro lot
- Date livraison
- Agriculteur (nom + prénom)
- Type de datte
- Nombre de caisses
- Quantité nette (kg)
- Statut (badge coloré)
- Actions

**Traductions** (fr, en, ar)
- Navigation, titres, formulaires, messages

**Icône Sidebar:** `Package2` ou `TruckIcon`

---

### 1.2 Pesée - Pesage des livraisons

#### Backend
**Validator** (`src/validators/pesee.validator.ts`)
```typescript
- CreatePeseeInput
  - livraisonId: string (required)
  - poidsBrut: number (required, min: 0)
  - tare: number (required, min: 0)
  - poidsNet: number (calculated)
```

**Repository** (`src/repositories/pesee.repository.ts`)
```typescript
- findAll(tenantId)
- findByLivraisonId(livraisonId, tenantId)
- create(tenantId, data)
- delete(id, tenantId)
```

**Service** (`src/services/pesee.service.ts`)
```typescript
- create(tenantId, userId, data)
  → Calcule poidsNet = poidsBrut - tare
  → Met à jour Livraison.quantiteNette
  → Change statut Livraison → PESEE_FAITE
- delete(tenantId, userId, id)
```

**Actions** (`src/actions/pesees/`)
- `create-pesee.action.ts`
- `delete-pesee.action.ts`

#### Frontend
**Composants** (`src/components/features/pesees/`)
- `CreatePeseeDialog.tsx` - Dialog inline dans détails livraison
- `PeseesList.tsx` - Liste des pesées d'une livraison

---

### 1.3 Échantillon - Prélèvement pour analyse

#### Backend
**Validator** (`src/validators/echantillon.validator.ts`)
```typescript
- CreateEchantillonInput
  - code: string (auto-généré: "ECH-2026-0001")
  - livraisonId: string (required)
  - poids: number (required, min: 0)
```

**Repository** (`src/repositories/echantillon.repository.ts`)
```typescript
- findAll(tenantId, filters?)
- findByLivraisonId(livraisonId, tenantId)
- findById(id, tenantId)
- create(tenantId, data)
- generateCode(tenantId)
- updateStatut(id, statut, tenantId)
```

**Service** (`src/services/echantillon.service.ts`)
```typescript
- create(tenantId, userId, data)
  → Change statut Livraison → ECHANTILLON_PRIS
```

#### Frontend
**Composants** (`src/components/features/echantillons/`)
- `CreateEchantillonDialog.tsx`
- `EchantillonsList.tsx`

---

### 1.4 Analyse - Résultats laboratoire

#### Backend
**Validator** (`src/validators/analyse.validator.ts`)
```typescript
- CreateAnalyseInput
  - echantillonId: string (required)
  - tauxHumidite: number (required, 0-100)
  - tauxImpuretes: number (required, 0-100)
  - calibre: enum (PETIT, MOYEN, GROS)
  - couleur: enum (CLAIRE, AMBREE, FONCEE)
  - qualite: enum (EXTRA, CHOIX, STANDARD, INDUSTRIELLE)
  - observations?: string
```

**Repository** (`src/repositories/analyse.repository.ts`)
```typescript
- findByEchantillonId(echantillonId, tenantId)
- create(tenantId, data)
```

**Service** (`src/services/analyse.service.ts`)
```typescript
- create(tenantId, userId, data)
  → Met à jour Echantillon.statut → ANALYSE_FAITE
  → Change statut Livraison → ANALYSE_FAITE
```

#### Frontend
**Page** (`src/app/(dashboard)/dashboard/analyses/`)
- Page liste des échantillons à analyser
- Page détails analyse

**Composants** (`src/components/features/analyses/`)
- `CreateAnalyseDialog.tsx` - Formulaire détaillé
- `AnalyseDetailsCard.tsx`

---

## Phase 2: Prêt de Caisses 📦

### 2.1 PretCaisse

#### Backend
**Validator** (`src/validators/pret-caisse.validator.ts`)
```typescript
- CreatePretCaisseInput
  - agriculteurId: string
  - typeCaisseId: string
  - nombrePrete: number (min: 1)
  - dateRetourPrevu: Date
  
- RetourPretCaisseInput
  - id: string
  - nombreRetourne: number
  - dateRetourEffectif: Date
```

**Repository** (`src/repositories/pret-caisse.repository.ts`)
```typescript
- findAll(tenantId, filters?)
- findByAgriculteur(agriculteurId, tenantId)
- create(tenantId, data)
- updateRetour(id, data, tenantId)
- getStatistics(tenantId) → En cours, retournés, en retard
```

**Service** (`src/services/pret-caisse.service.ts`)
```typescript
- create(tenantId, userId, data)
  → statut = "EN_COURS"
- enregistrerRetour(tenantId, userId, data)
  → Vérifie nombreRetourne <= nombrePrete
  → statut = "RETOURNE" ou "RETOUR_PARTIEL"
```

#### Frontend
**Page** (`src/app/(dashboard)/dashboard/prets-caisses/`)
- Liste des prêts avec filtres (statut, agriculteur)
- Dialog de création
- Dialog de retour

**Colonnes**
- Agriculteur
- Type caisse
- Nombre prêté
- Nombre retourné
- Date prêt
- Date retour prévu
- Statut
- Actions

**Icône Sidebar:** `Package` ou `Archive`

---

## Phase 3: Gestion du Stock 📊

### 3.1 StockDate

#### Backend
**Validator** (`src/validators/stock-date.validator.ts`)
```typescript
- CreateStockDateInput
  - typeDateId: string
  - quantite: number
  - emplacement: string
  - observations?: string
  
- UpdateStockDateInput
  - id: string
  - quantite?: number
  - emplacement?: string
  - statut?: enum (DISPONIBLE, RESERVE, VENDU)
```

**Repository** (`src/repositories/stock-date.repository.ts`)
```typescript
- findAll(tenantId, filters?)
- findById(id, tenantId)
- create(tenantId, data)
- update(id, data, tenantId)
- ajusterQuantite(id, delta, tenantId)
- getStatistics(tenantId) → Par type, par emplacement
```

**Service** (`src/services/stock-date.service.ts`)
```typescript
- getAll(tenantId, userId, filters?)
- create(tenantId, userId, data)
  → Depuis validation d'une Livraison
- ajusterQuantite(tenantId, userId, id, delta)
  → Utilisé par BonSortie
```

#### Frontend
**Page** (`src/app/(dashboard)/dashboard/stock/`)
- Vue tableau avec filtres
- Stats par type de datte
- Alertes stock bas

**Colonnes**
- Type de datte
- Quantité (kg)
- Emplacement
- Date entrée
- Statut
- Actions

**Icône Sidebar:** `Warehouse` ou `Database`

---

### 3.2 BonSortie

#### Backend
**Validator** (`src/validators/bon-sortie.validator.ts`)
```typescript
- CreateBonSortieInput
  - numero: string (auto-généré)
  - stockId: string
  - quantite: number
  - typeCaisseId: string
  - destination: string
  - observations?: string
```

**Repository** (`src/repositories/bon-sortie.repository.ts`)
```typescript
- findAll(tenantId)
- create(tenantId, data)
- generateNumero(tenantId) → "BS-2026-0001"
```

**Service** (`src/services/bon-sortie.service.ts`)
```typescript
- create(tenantId, userId, data)
  → Vérifie quantité disponible en stock
  → Décrémente StockDate.quantite
  → Crée audit log
```

#### Frontend
**Page** (`src/app/(dashboard)/dashboard/bons-sortie/`)
- Liste des bons de sortie
- Dialog de création

**Icône Sidebar:** `ArrowRightFromLine` ou `FileOutput`

---

## Checklist d'implémentation par module

### Pour chaque module:
- [ ] Validator Zod
- [ ] Repository Prisma
- [ ] Service avec RBAC + Audit
- [ ] 4 Actions (get, create, update, delete)
- [ ] Permissions dans constants
- [ ] Page principale
- [ ] Page détails (si nécessaire)
- [ ] Composants dialogs (create, update, delete)
- [ ] Table advanced avec colonnes
- [ ] Traductions (fr, en, ar)
- [ ] Lien Sidebar avec icône
- [ ] Test build TypeScript
- [ ] Test création/modification/suppression

---

## Ordre recommandé d'implémentation

1. **Livraison** (base du flux)
2. **Pesée** (complète la livraison)
3. **Échantillon** (pour analyse)
4. **Analyse** (validation qualité)
5. **StockDate** (résultat du flux)
6. **PretCaisse** (gestion caisses en parallèle)
7. **BonSortie** (sortie de stock)
8. **Client & Vente** (optionnel)

---

## Estimation du temps

- **Livraison complète** (avec Pesée, Échantillon, Analyse): 2-3 jours
- **PretCaisse**: 1 jour
- **StockDate + BonSortie**: 1-2 jours
- **Client + Vente**: 1 jour (optionnel)

**Total estimé:** 5-7 jours de développement
