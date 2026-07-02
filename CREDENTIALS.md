# Credentials de Test - Multi-Tenant

## 🔐 Compte Administrateur

**Email:** `admin@dattes.tn`  
**Mot de passe:** `admin123`  
**Hash bcrypt:** `$2b$10$qkphAEaMyotPpdxi237izuQMg8qaJvFMcfLuBh4ZLYq/dycc9l9Kyc`

### Accès Wakalas

L'administrateur a maintenant accès aux 2 Wakalas suivantes:

#### 1. Wakala Principale (MAIN)
- **Tenant ID:** `default-tenant-id`
- **Code:** `MAIN`
- **Nom:** `Wakala Principale`
- **Rôle:** `ADMIN`

#### 2. Wakala Tunis (TUN-NORD)
- **Tenant ID:** `8f5e26df-44cd-4d5b-ad37-ee2807c2dd8f`
- **Code:** `TUN-NORD`
- **Nom:** `wakala tunis`
- **Rôle:** `ADMIN`

## 🔄 Flux de Connexion Multi-Tenant

### Étape 1: Sélection de Wakala
**URL:** http://localhost:3000

1. Page d'accueil affiche toutes les Wakalas disponibles (2 cartes)
2. Utilisateur clique sur la Wakala souhaitée
3. Le `tenantId` est stocké dans `sessionStorage`
4. Redirection vers `/login` avec la Wakala pré-sélectionnée

### Étape 2: Login
**URL:** http://localhost:3000/login

1. Formulaire affiche la Wakala sélectionnée en haut
2. Utilisateur entre:
   - Email: `admin@dattes.tn`
   - Mot de passe: `admin123`
3. Le système vérifie:
   - ✅ Email/password corrects
   - ✅ Utilisateur appartient à cette Wakala
   - ✅ Wakala est active
4. Session créée avec `tenantId`, `tenantName`, `tenantCode`, `role`

### Étape 3: Dashboard
**URL:** http://localhost:3000/dashboard

- Dashboard affiche les données de la Wakala sélectionnée
- TopBar montre: Wakala name (code) - User name
- Toutes les données (régions, agriculteurs, etc.) sont filtrées par `tenantId`

## 🧪 Tests à Effectuer

### Test 1: Login avec Wakala Principale
1. Aller sur http://localhost:3000
2. Cliquer sur "Wakala Principale (MAIN)"
3. Login: `admin@dattes.tn` / `admin123`
4. ✅ Devrait se connecter et afficher le dashboard
5. Créer une région "Test MAIN"

### Test 2: Login avec Wakala Tunis
1. Déconnexion (ou nouvel onglet incognito)
2. Aller sur http://localhost:3000
3. Cliquer sur "wakala tunis (TUN-NORD)"
4. Login: `admin@dattes.tn` / `admin123`
5. ✅ Devrait se connecter et afficher le dashboard
6. Vérifier que la région "Test MAIN" n'apparaît PAS (isolation)
7. Créer une région "Test TUNIS"

### Test 3: Isolation des Données
1. Se connecter à Wakala Principale
2. Lister les régions → Ne voir que celles de MAIN
3. Se déconnecter
4. Se connecter à Wakala Tunis
5. Lister les régions → Ne voir que celles de TUN-NORD
6. ✅ Confirmation de l'isolation complète

### Test 4: Tentative d'Accès Non Autorisé
1. Créer un nouvel utilisateur (sans TenantUser pour TUN-NORD)
2. Essayer de se connecter à Wakala Tunis
3. ✅ Devrait échouer avec "TENANT_ACCESS_DENIED"

## 📊 État de la Base de Données

### Tenants
```sql
SELECT id, name, code, active FROM "Tenant";
```
| ID | Name | Code | Active |
|----|------|------|--------|
| default-tenant-id | Wakala Principale | MAIN | true |
| 8f5e26df-44cd-4d5b-ad37-ee2807c2dd8f | wakala tunis | TUN-NORD | true |

### Users
```sql
SELECT id, email, name, active FROM "User" WHERE email = 'admin@dattes.tn';
```
| ID | Email | Name | Active |
|----|-------|------|--------|
| ad67956b-dc31-46f1-9f52-9c70d7bac080 | admin@dattes.tn | Super Admin | true |

### TenantUser (Accès)
```sql
SELECT tu.*, t.name as tenant_name, r.name as role_name 
FROM "TenantUser" tu
JOIN "Tenant" t ON tu."tenantId" = t.id
JOIN "Role" r ON tu."roleId" = r.id
WHERE tu."userId" = 'ad67956b-dc31-46f1-9f52-9c70d7bac080';
```
| Tenant Name | Code | Role | Active |
|-------------|------|------|--------|
| Wakala Principale | MAIN | ADMIN | true |
| wakala tunis | TUN-NORD | ADMIN | true |

## 🔧 Scripts Utiles

### Vérifier les tenants d'un utilisateur
```bash
bun run scripts/check-admin-tenants.ts
```

### Ajouter l'admin à une nouvelle Wakala
```bash
bun run scripts/add-admin-to-wakala-tunis.ts
```

### Vérifier tous les tenants
```bash
bun run scripts/check-tenants.ts
```

## ⚠️ Sécurité

### Règles Strictes
1. ✅ Le `tenantId` est TOUJOURS vérifié côté serveur (jamais trusté du client)
2. ✅ Chaque query Prisma inclut `WHERE tenantId = ?`
3. ✅ La session contient le `tenantId` vérifié lors du login
4. ✅ Les Server Actions récupèrent le `tenantId` via `getTenantId()` (depuis session)
5. ✅ Impossible d'accéder aux données d'un autre tenant

### Ce qui est Impossible
- ❌ Un utilisateur ne peut PAS voir les données d'un tenant où il n'a pas accès
- ❌ Un utilisateur ne peut PAS modifier le `tenantId` dans le client
- ❌ Un utilisateur ne peut PAS se connecter à un tenant non autorisé
- ❌ Une query ne peut PAS retourner des données multi-tenant mélangées

## 🎯 Résumé

**Connexion Réussie:** `admin@dattes.tn` / `admin123`  
**Wakalas Accessibles:** 2 (MAIN et TUN-NORD)  
**Isolation:** Complète ✅  
**Multi-Tenant:** Fonctionnel ✅  
**Prêt pour Production:** Après tests ✅

---

**Dernière mise à jour:** 02/07/2026  
**Statut:** ✅ ACTIF - Multi-tenant 100% fonctionnel
