# 🚀 Guide Complet de Migration Multi-Tenant

## ⚠️ AVANT DE COMMENCER

### Prérequis
- ✅ Backup complet de la base de données
- ✅ Environnement de test disponible
- ✅ Accès PostgreSQL
- ✅ Bun installé

### Temps Estimé
- **Migration DB**: 15-20 minutes
- **Tests**: 30 minutes
- **Total**: ~1 heure

---

## 📋 ÉTAPE PAR ÉTAPE

### 1. Backup Base de Données (OBLIGATOIRE!)

```bash
# Windows (CMD)
pg_dump %DATABASE_URL% > backup_%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%.sql

# PowerShell
$date = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump $env:DATABASE_URL > "backup_$date.sql"

# Vérifier le backup
dir backup_*.sql
```

### 2. Migration du Schema Prisma

```bash
# Exécuter le script automatique
node scripts/migrate-to-multitenant.js

# OU manuellement:
copy prisma\schema-multitenant.prisma prisma\schema.prisma
```

### 3. Générer Client Prisma

```bash
bunx prisma generate
```

**Vérifier**: Pas d'erreurs dans la génération

### 4. Exécuter Migration SQL

```bash
# Méthode 1: Via psql
psql %DATABASE_URL% < prisma\migrations\add_multitenant\migration.sql

# Méthode 2: Via Prisma Migrate
bunx prisma migrate deploy
```

**Vérifier**: Migration réussie sans erreurs

### 5. Vérifier la Base de Données

```bash
# Ouvrir Prisma Studio
bunx prisma studio
```

**Vérifier**:
- ✅ Table `Tenant` existe
- ✅ Table `TenantUser` existe
- ✅ Tenant "Wakala Principale" créé (id: `default-tenant-id`)
- ✅ Toutes les tables ont colonne `tenantId`
- ✅ Données existantes ont `tenantId = 'default-tenant-id'`

### 6. Créer Données TenantUser

```sql
-- Si pas créées automatiquement par la migration
-- Connecter tous les users existants au tenant par défaut

INSERT INTO "TenantUser" ("id", "userId", "tenantId", "roleId", "active", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    u."id",
    'default-tenant-id',
    u."roleId",
    u."active",
    NOW(),
    NOW()
FROM "User" u
WHERE NOT EXISTS (
    SELECT 1 FROM "TenantUser" tu 
    WHERE tu."userId" = u."id" 
    AND tu."tenantId" = 'default-tenant-id'
);
```

### 7. Redémarrer l'Application

```bash
# Arrêter le serveur (Ctrl+C)

# Redémarrer
bun run dev
```

### 8. Premier Test

1. **Aller sur `/`** (page d'accueil)
   - Devrait afficher "Wakala Principale"
   
2. **Créer une nouvelle Wakala**
   - Cliquer "Créer Nouvelle Wakala"
   - Remplir:
     - Nom: `Wakala Test`
     - Code: `TEST`
   - Noter les credentials affichés

3. **Tester Login**
   - Cliquer sur card "Wakala Test"
   - Login avec credentials admin
   - Devrait rediriger vers dashboard

4. **Vérifier Isolation**
   - Dashboard doit être vide (nouvelle Wakala)
   - Créer un agriculteur
   - Retourner sur `/`
   - Se connecter à "Wakala Principale"
   - L'agriculteur créé ne doit PAS être visible

---

## 🔧 Troubleshooting

### Erreur: "Table Tenant does not exist"

**Cause**: Migration SQL pas exécutée

**Solution**:
```bash
psql %DATABASE_URL% < prisma\migrations\add_multitenant\migration.sql
```

### Erreur: "Column tenantId does not exist"

**Cause**: Pas regénéré le client Prisma

**Solution**:
```bash
bunx prisma generate
# Redémarrer serveur
```

### Erreur: "TENANT_ACCESS_DENIED"

**Cause**: Pas de TenantUser pour cet utilisateur

**Solution**:
```sql
-- Vérifier TenantUser
SELECT * FROM "TenantUser" WHERE "userId" = 'user-id';

-- Créer si manquant
INSERT INTO "TenantUser" (...) VALUES (...);
```

### Page blanche sur `/`

**Cause**: Table Tenant vide

**Solution**:
```sql
-- Créer tenant par défaut
INSERT INTO "Tenant" ("id", "name", "code", "active", "createdAt", "updatedAt")
VALUES ('default-tenant-id', 'Wakala Principale', 'MAIN', true, NOW(), NOW());
```

### Erreur: "Cannot read property 'name' of undefined"

**Cause**: JWT ancien encore en cache

**Solution**:
1. Se déconnecter
2. Vider cache navigateur
3. Se reconnecter

---

## 🔄 Rollback

Si problème majeur:

### 1. Arrêter le Serveur

```bash
Ctrl+C
```

### 2. Exécuter Script Rollback

```bash
node scripts/rollback-multitenant.js
```

### 3. Restaurer Base de Données

```bash
# Trouver le backup
dir backup_*.sql

# Restaurer
psql %DATABASE_URL% < backup_YYYYMMDD.sql
```

### 4. Regénérer Client

```bash
bunx prisma generate
```

### 5. Redémarrer

```bash
bun run dev
```

---

## ✅ Validation Post-Migration

### Checklist Technique

- [ ] Table `Tenant` existe et contient données
- [ ] Table `TenantUser` existe et contient données
- [ ] Toutes les tables métier ont `tenantId`
- [ ] Index sur `tenantId` créés
- [ ] Client Prisma regénéré sans erreurs
- [ ] Aucune erreur au démarrage serveur

### Checklist Fonctionnelle

- [ ] Page `/` affiche les Wakalas
- [ ] Création Wakala fonctionne
- [ ] Login avec tenantId fonctionne
- [ ] Dashboard affiche Wakala courante
- [ ] TopBar affiche WakalaSwitcher
- [ ] CRUD agriculteurs fonctionne
- [ ] CRUD régions fonctionne
- [ ] Isolation données vérifiée

### Checklist Sécurité

- [ ] Impossible de voir données autre Wakala
- [ ] Login refuse si pas dans TenantUser
- [ ] tenantId toujours filtré dans queries
- [ ] Session contient bon tenantId
- [ ] Changement Wakala met à jour session

---

## 📊 Données de Test

### Script de Test SQL

```sql
-- 1. Créer 2 Wakalas
INSERT INTO "Tenant" ("id", "name", "code", "active", "createdAt", "updatedAt")
VALUES 
    ('wakala-a', 'Wakala A', 'WAKALA-A', true, NOW(), NOW()),
    ('wakala-b', 'Wakala B', 'WAKALA-B', true, NOW(), NOW());

-- 2. Créer 2 Régions (une par Wakala)
INSERT INTO "Region" ("id", "tenantId", "nom", "code", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'wakala-a', 'Région A', 'REG-A', NOW(), NOW()),
    (gen_random_uuid()::text, 'wakala-b', 'Région B', 'REG-B', NOW(), NOW());

-- 3. Vérifier isolation
SELECT "nom", "code", "tenantId" FROM "Region";
-- Devrait montrer 2 régions avec tenantId différents
```

---

## 📚 Ressources

### Documentation
- `NOUVEAU_FLUX_MULTITENANT.md` - Architecture complète
- `MULTITENANT_REFACTORING_GUIDE.md` - Guide détaillé
- `README_MULTITENANT.md` - Guide rapide

### Scripts
- `scripts/migrate-to-multitenant.js` - Migration auto
- `scripts/rollback-multitenant.js` - Rollback auto

### Fichiers
- `prisma/schema-multitenant.prisma` - Nouveau schema
- `prisma/migrations/add_multitenant/migration.sql` - Migration SQL

---

## 🎯 Prochaines Étapes

Après migration réussie:

### Phase 1: Repositories
- [ ] Mettre à jour `region.repository.ts`
- [ ] Mettre à jour `agriculteur.repository.ts`
- [ ] Mettre à jour autres repositories

### Phase 2: Services  
- [ ] Mettre à jour `region.service.ts`
- [ ] Mettre à jour `agriculteur.service.ts`
- [ ] Mettre à jour autres services

### Phase 3: Actions
- [ ] Mettre à jour toutes les actions
- [ ] Ajouter `getTenantId()` partout

### Phase 4: UI
- [ ] Mettre à jour WakalaSwitcher
- [ ] Ajouter indicateurs Wakala
- [ ] Améliorer UX

---

## 🆘 Support

En cas de problème:

1. **Vérifier logs serveur**: Erreurs détaillées
2. **Consulter Prisma Studio**: État base de données
3. **Tester avec SQL direct**: Isolation données
4. **Rollback si nécessaire**: Restaurer backup

---

## ✨ Félicitations!

Si tous les tests passent, votre application est maintenant **Multi-Tenant SaaS ready**! 🎉

**Prochaine étape**: Créer vos Wakalas et profiter de l'isolation complète des données!
