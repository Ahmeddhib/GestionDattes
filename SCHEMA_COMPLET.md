# 📊 Schéma Prisma Complet - Gestion Dattes

## ✅ Schéma Mis à Jour

Le schéma Prisma a été étendu pour inclure **tout le système de gestion de dattes** :

---

## 🗂️ Modèles Implémentés

### 1. **Gestion des Utilisateurs & RBAC** (Existant + Amélioré)

#### Role
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  users       User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Rôles créés dans le seed :**
- `ADMIN` - Administrateur avec tous les droits
- `AGENT` - Agent de réception des livraisons  
- `LABORANTIN` - Laborantin avec accès aux analyses
- `RESPONSABLE_STOCK` - Responsable de la gestion des stocks
- `DIRECTION` - Direction avec accès aux rapports

#### User
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  active    Boolean  @default(true)
  roleId    String
  role      Role     @relation(fields: [roleId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  auditLogs AuditLog[] @relation("ActorLogs")
}
```

#### AuditLog
```prisma
model AuditLog {
  id          String      @id @default(cuid())
  actorId     String
  targetId    String?
  action      AuditAction
  description String?
  details     Json?
  createdAt   DateTime    @default(now())
  
  actor User @relation("ActorLogs", fields: [actorId], references: [id])
}
```

**Actions d'audit étendues :**
- User: CREATE_USER, UPDATE_USER, ACTIVATE_USER, DEACTIVATE_USER, CHANGE_ROLE
- Role: CREATE_ROLE, UPDATE_ROLE, DELETE_ROLE
- Région: CREATE_REGION, UPDATE_REGION, DELETE_REGION
- Agriculteur: CREATE_AGRICULTEUR, UPDATE_AGRICULTEUR, DELETE_AGRICULTEUR
- Livraison: CREATE_LIVRAISON, UPDATE_LIVRAISON, DELETE_LIVRAISON
- Vente: CREATE_VENTE, UPDATE_VENTE, DELETE_VENTE
- Bon de sortie: CREATE_BON_SORTIE, UPDATE_BON_SORTIE, DELETE_BON_SORTIE

---

### 2. **Gestion Géographique** (Nouveau ✨)

#### Region
```prisma
model Region {
  id           String        @id @default(cuid())
  nom          String
  code         String?       @unique
  agriculteurs Agriculteur[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}
```

**Régions créées dans le seed :**
- Kebili (KB)
- Tozeur (TZ)
- Gabès (GB)
- Gafsa (GF)

---

### 3. **Gestion des Produits** (Nouveau ✨)

#### TypeDate (Type de Datte)
```prisma
model TypeDate {
  id          String      @id @default(cuid())
  nom         String      @unique
  description String?
  livraisons  Livraison[]
  stocks      StockDate[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

**Types de dattes créés dans le seed :**
- Deglet Nour - Datte de qualité supérieure, translucide
- Allig - Datte moelleuse et sucrée
- Kenta - Datte sèche de bonne conservation
- Kentichi - Datte mi-molle de qualité

#### TypeCaisse
```prisma
model TypeCaisse {
  id         String      @id @default(cuid())
  nom        String      @unique
  poidsKg    Float
  livraisons Livraison[]
  bonSorties BonSortie[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}
```

**Types de caisses créés dans le seed :**
- Caisse 5kg (5.0 kg)
- Caisse 10kg (10.0 kg)
- Caisse 20kg (20.0 kg)
- Palette 500kg (500.0 kg)

---

### 4. **Gestion des Agriculteurs** (Nouveau ✨)

#### Agriculteur
```prisma
model Agriculteur {
  id                String      @id @default(cuid())
  code              String      @unique
  cin               String      @unique
  nom               String
  prenom            String
  telephone         String?
  adresse           String?
  nbPalmiers        Int
  superficie        Float?
  productionEstimee Float?
  regionId          String
  region            Region      @relation(fields: [regionId], references: [id])
  livraisons        Livraison[]
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}
```

**3 Agriculteurs de démonstration créés dans le seed**

---

### 5. **Gestion des Livraisons & Réception** (Nouveau ✨)

#### Livraison
```prisma
model Livraison {
  id             String        @id @default(cuid())
  numeroLot      String        @unique
  dateLivraison  DateTime
  quantiteKg     Float
  agriculteurId  String
  agriculteur    Agriculteur   @relation(fields: [agriculteurId], references: [id])
  typeDateId     String
  typeDate       TypeDate      @relation(fields: [typeDateId], references: [id])
  typeCaisseId   String
  typeCaisse     TypeCaisse    @relation(fields: [typeCaisseId], references: [id])
  bonAchat       BonAchat?
  pesee          Pesee?
  echantillons   Echantillon[]
  stocks         StockDate[]
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}
```

#### BonAchat
```prisma
model BonAchat {
  id          String    @id @default(cuid())
  numero      String    @unique
  prixKg      Float
  montant     Float
  livraisonId String    @unique
  livraison   Livraison @relation(fields: [livraisonId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

#### Pesee
```prisma
model Pesee {
  id          String    @id @default(cuid())
  poidsBrut   Float
  poidsNet    Float
  tare        Float?
  livraisonId String    @unique
  livraison   Livraison @relation(fields: [livraisonId], references: [id])
  createdAt   DateTime  @default(now())
}
```

---

### 6. **Gestion Laboratoire** (Nouveau ✨)

#### Echantillon
```prisma
model Echantillon {
  id          String      @id @default(cuid())
  code        String      @unique
  livraisonId String
  livraison   Livraison   @relation(fields: [livraisonId], references: [id])
  analyses    Analyse[]
  createdAt   DateTime    @default(now())
}
```

#### Analyse (Nouveau ✨)
```prisma
model Analyse {
  id             String      @id @default(cuid())
  echantillonId  String
  echantillon    Echantillon @relation(fields: [echantillonId], references: [id])
  dateAnalyse    DateTime    @default(now())
  humidite       Float?
  tauxSucre      Float?
  calibre        String?
  qualite        String?
  observations   String?
  conforme       Boolean     @default(true)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}
```

---

### 7. **Gestion des Stocks** (Nouveau ✨)

#### StockDate
```prisma
model StockDate {
  id          String      @id @default(cuid())
  quantite    Float
  dateEntree  DateTime    @default(now())
  typeDateId  String
  typeDate    TypeDate    @relation(fields: [typeDateId], references: [id])
  livraisonId String
  livraison   Livraison   @relation(fields: [livraisonId], references: [id])
  ventes      Vente[]
  bonSorties  BonSortie[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

---

### 8. **Gestion des Clients & Ventes** (Nouveau ✨)

#### Client
```prisma
model Client {
  id        String   @id @default(cuid())
  nom       String
  telephone String?
  adresse   String?
  email     String?
  ventes    Vente[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**2 Clients de démonstration créés dans le seed**

#### Vente
```prisma
model Vente {
  id           String    @id @default(cuid())
  date         DateTime  @default(now())
  quantite     Float
  prixUnitaire Float
  montant      Float
  clientId     String
  client       Client    @relation(fields: [clientId], references: [id])
  stockId      String
  stock        StockDate @relation(fields: [stockId], references: [id])
  createdAt    DateTime  @default(now())
}
```

---

### 9. **Gestion des Sorties** (Nouveau ✨)

#### BonSortie
```prisma
model BonSortie {
  id             String     @id @default(cuid())
  numero         String     @unique
  dateSortie     DateTime   @default(now())
  quantiteTotale Float
  stockId        String
  stock          StockDate  @relation(fields: [stockId], references: [id])
  typeCaisseId   String
  typeCaisse     TypeCaisse @relation(fields: [typeCaisseId], references: [id])
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}
```

---

## 🔧 Modifications Apportées

### Ce qui a changé :
1. ✅ **Suppression de l'enum `UserRole`** - Utilisation de la relation Role à la place
2. ✅ **Ajout de 13 nouveaux modèles** pour la gestion complète des dattes
3. ✅ **Extension de l'enum `AuditAction`** avec 15 nouvelles actions
4. ✅ **Ajout du modèle `Analyse`** pour les analyses laboratoire
5. ✅ **Ajout du champ `details: Json?`** dans AuditLog pour plus de flexibilité
6. ✅ **Ajout d'index** sur tous les champs fréquemment recherchés

### Corrections appliquées :
1. ✅ **Constants ROLES** mises à jour : ADMIN, AGENT, LABORANTIN, RESPONSABLE_STOCK, DIRECTION
2. ✅ **Constants PERMISSIONS** mises à jour pour utiliser les nouveaux rôles
3. ✅ **Seed** mis à jour pour créer toutes les données de démonstration

---

## 📊 Statistiques du Schéma

| Catégorie | Nombre |
|-----------|--------|
| **Modèles totaux** | 16 |
| **Enums** | 1 (AuditAction) |
| **Relations** | 25+ |
| **Index** | 30+ |
| **Actions d'audit** | 22 |

---

## 🌱 Seed Data

Le seed crée automatiquement :
- ✅ 5 rôles (ADMIN, AGENT, LABORANTIN, RESPONSABLE_STOCK, DIRECTION)
- ✅ 4 utilisateurs (admin, agent, labo, stock)
- ✅ 4 régions tunisiennes
- ✅ 4 types de dattes
- ✅ 4 types de caisses
- ✅ 3 agriculteurs de démonstration
- ✅ 2 clients de démonstration

---

## 🚀 Commandes Utiles

```bash
# Générer le client Prisma
bunx prisma generate

# Créer une migration
bunx prisma migrate dev --name nom_migration

# Reset DB + seed
bunx prisma migrate reset --force

# Seed uniquement
bunx prisma db seed

# Prisma Studio (interface graphique)
bunx prisma studio
```

---

## 📝 Comptes Utilisateurs

```
Admin:       admin@dattes.tn / admin123
Agent:       agent@dattes.tn / admin123
Laborantin:  labo@dattes.tn / admin123
Stock:       stock@dattes.tn / admin123
```

---

## 🔗 Relations Principales

```
Region → Agriculteur → Livraison → StockDate → Vente → Client
                          ↓
                      Echantillon → Analyse
                          ↓
                       BonAchat
                          ↓
                        Pesee
```

---

## ✅ Status

**Schéma** : ✅ Complet et fonctionnel  
**Migrations** : ✅ Appliquées  
**Seed** : ✅ Données de démonstration créées  
**Build** : ✅ Passe sans erreurs  
**Client Prisma** : ✅ Généré  

---

**Date de mise à jour** : 27 juin 2026  
**Version** : 2.0.0 - Schéma Complet Gestion Dattes
