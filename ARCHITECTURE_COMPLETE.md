# Architecture Complète - Système de Gestion des Dattes

## Vue d'ensemble du système

Ce document présente l'architecture complète du système de gestion des dattes avec tous les modules et leurs relations.

## Modules implémentés ✅

1. **Multi-tenant & Authentication**
   - Tenant (Wakala)
   - User
   - Role
   - TenantUser (relation many-to-many)
   - AuditLog

2. **Données de référence**
   - Region
   - TypeCaisse ✅
   - TypeDate ✅

3. **Gestion des agriculteurs**
   - Agriculteur ✅

## Modules à implémenter 🚧

4. **Livraisons**
   - Livraison (réception des dattes des agriculteurs)
   - Pesee (pesage des livraisons)
   - Echantillon (prélèvement pour analyse)
   - Analyse (résultats du laboratoire)

5. **Gestion des caisses**
   - PretCaisse (prêt de caisses aux agriculteurs)

6. **Gestion du stock**
   - StockDate (stock de dattes par type)
   - BonSortie (sortie de stock)

7. **Achats et ventes**
   - BonAchat (achat de dattes)
   - Client (clients pour la vente)
   - Vente (vente de dattes)

## Flux métier principal

```
1. RÉCEPTION
   Agriculteur → Livraison → Pesee → Echantillon → Analyse → StockDate

2. PRÊT DE CAISSES
   Agriculteur → PretCaisse (prêt) → PretCaisse (retour)

3. SORTIE
   StockDate → BonSortie

4. VENTE
   Client → Vente → StockDate (décrémentation)
```

## Relations clés

### Multi-tenant
- Toutes les entités ont une relation avec `Tenant`
- Isolation complète des données par Wakala

### Livraisons
- `Livraison` → `Agriculteur` (many-to-one)
- `Livraison` → `TypeDate` (many-to-one)
- `Livraison` → `TypeCaisse` (many-to-one)
- `Livraison` → `Pesee` (one-to-many)
- `Livraison` → `Echantillon` (one-to-many)

### Stock
- `StockDate` → `TypeDate` (many-to-one)
- `StockDate` → `BonSortie` (one-to-many)

### Prêts
- `PretCaisse` → `Agriculteur` (many-to-one)
- `PretCaisse` → `TypeCaisse` (many-to-one)

## Permissions par rôle

| Module | ADMIN | AGENT | RESPONSABLE_STOCK | LABORANTIN | DIRECTION |
|--------|-------|-------|-------------------|------------|-----------|
| Regions | CRUD | R | R | R | R |
| Agriculteurs | CRUD | CRU | R | - | R |
| TypeCaisse | CRUD | R | CRU | - | R |
| TypeDate | CRUD | R | CRU | R | R |
| Livraisons | CRUD | CRU | CRU | R | R |
| Pesee | CRUD | CRU | CRU | R | R |
| Echantillon | CRUD | CRU | - | CRU | R |
| Analyse | CRUD | - | - | CRU | R |
| PretCaisse | CRUD | CRU | CRU | - | R |
| Stock | CRUD | R | CRU | R | R |
| BonSortie | CRUD | R | CRU | - | R |
| Users | CRU | - | - | - | R |
| Roles | CRU | - | - | - | R |
| AuditLog | R | - | - | - | R |

**Légende:** C=Create, R=Read, U=Update, D=Delete

## Ordre d'implémentation recommandé

### Phase 1: Réception des dattes (prioritaire)
1. **Livraisons** - Module de réception des dattes
2. **Pesée** - Enregistrement des poids
3. **Échantillons** - Prélèvement pour analyse
4. **Analyses** - Résultats du laboratoire

### Phase 2: Gestion des caisses
5. **PrêtCaisse** - Prêt et retour de caisses

### Phase 3: Gestion du stock
6. **StockDate** - Inventaire des dattes
7. **BonSortie** - Sorties de stock

### Phase 4: Ventes (optionnel)
8. **Client** - Gestion des clients
9. **Vente** - Ventes de dattes
10. **BonAchat** - Achats externes

## Architecture technique

### Backend
```
Repository Layer (Prisma)
    ↓
Service Layer (Business Logic + RBAC + Audit)
    ↓
Action Layer (Server Actions)
    ↓
Page Layer (React Server Components)
```

### Transformation des données
```
Prisma (PascalCase: Region, Agriculteur, Livraison)
    ↓
Service Layer (transformation)
    ↓
Frontend (camelCase: region, agriculteur, livraison)
```

### Sécurité multi-tenant
- `tenantId` toujours depuis `getTenantId()` (jamais du client)
- Filtrage automatique dans les repositories
- Permissions vérifiées dans les services
- Audit automatique de toutes les actions

## Stack technique

- **Frontend:** Next.js 16, React, TypeScript, TailwindCSS
- **Backend:** Next.js Server Actions, Prisma ORM
- **Database:** PostgreSQL (Neon) avec multi-tenant
- **Auth:** NextAuth.js
- **Validation:** Zod
- **UI:** shadcn/ui, Lucide icons
- **i18n:** Français, Anglais, Arabe

## Conventions de code

### Nommage
- **Prisma relations:** PascalCase (Region, Agriculteur, Livraison)
- **Frontend props:** camelCase (region, agriculteur, livraison)
- **Fichiers:** kebab-case (create-livraison.action.ts)
- **Composants:** PascalCase (CreateLivraisonDialog.tsx)

### Couleurs
- **Primary:** #C17A2B (amber)
- **Background:** #FAF0DC (sand)
- **Sidebar:** #3D1C00 (espresso)

### Border radius
- **Cards/Dialogs:** 14px
- **Buttons:** 9px
- **Inputs:** 7px
