# 🗄️ Guide: Créer une Nouvelle Base de Données de Test

## Étape 1: Créer Base Neon

### Via Console Neon (Recommandé)

1. **Aller sur** [https://console.neon.tech](https://console.neon.tech)

2. **Se connecter** avec votre compte

3. **Créer un nouveau projet**
   - Cliquer "New Project"
   - Nom: `gestion-dattes-multitenant-test`
   - Région: `US East (Ohio)` ou proche
   - PostgreSQL version: `16` (ou dernière)

4. **Récupérer les URLs de connexion**
   - Aller dans "Connection Details"
   - Copier:
     - **Pooled connection** (pour l'application)
     - **Direct connection** (pour Prisma)

## Étape 2: Créer Fichier .env.test

Dans votre projet, créer `.env.test`:

```env
# Nouvelle Base de Test Multi-Tenant
DATABASE_URL="postgresql://[USERNAME]:[PASSWORD]@[HOST]-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

DIRECT_URL="postgresql://[USERNAME]:[PASSWORD]@[HOST].c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Garder les mêmes
AUTH_SECRET="your-super-secret-key-change-this-in-production-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

**Remplacer** `[USERNAME]`, `[PASSWORD]`, `[HOST]` avec vos valeurs Neon.

## Étape 3: Basculer vers la Nouvelle Base

### Option A: Renommer les fichiers

```bash
# Sauvegarder .env actuel
mv .env .env.production

# Utiliser .env.test
mv .env.test .env
```

### Option B: Modifier .env directement

Remplacer les URLs dans `.env` avec celles de la nouvelle base.

## Étape 4: Initialiser la Nouvelle Base

```bash
# 1. Pousser le schema (ancien schema single-tenant)
bunx prisma db push

# 2. Vérifier avec Prisma Studio
bunx prisma studio
```

Cela va créer les tables de base (User, Role, Region, Agriculteur, etc.)

## Étape 5: Créer Données de Test (Optionnel)

```bash
# Exécuter le seed
bunx tsx prisma/seed.ts
```

Ou créer manuellement un utilisateur admin via Prisma Studio.

## Étape 6: Tester l'Application

```bash
# Démarrer le serveur
bun run dev
```

- Aller sur `http://localhost:3000/login`
- Se connecter avec l'utilisateur créé
- Vérifier que tout fonctionne

## Étape 7: Migrer vers Multi-Tenant

Une fois que tout fonctionne:

```bash
# 1. Migration schema
node scripts/migrate-to-multitenant.js

# 2. Générer client
bunx prisma generate

# 3. Exécuter migration SQL
bunx prisma db push --skip-generate

# OU via fichier SQL
# psql $DATABASE_URL < prisma/migrations/add_multitenant/migration.sql
```

## Étape 8: Tester Multi-Tenant

1. **Aller sur** `http://localhost:3000/`
   - Devrait afficher page sélection Wakala
   - Si erreur, vérifier que migration a réussi

2. **Créer première Wakala**
   - Cliquer "Créer Nouvelle Wakala"
   - Remplir formulaire
   - Noter credentials admin

3. **Se connecter**
   - Cliquer sur la Wakala créée
   - Login avec credentials
   - Vérifier dashboard

4. **Tester isolation**
   - Créer quelques données (agriculteurs, régions)
   - Créer une 2ème Wakala
   - Se connecter à la 2ème
   - Vérifier que les données de la 1ère ne sont pas visibles

## Retour à la Base de Production

Quand tout fonctionne sur la base de test:

```bash
# 1. Revenir à .env production
mv .env .env.test
mv .env.production .env

# 2. Regénérer client avec ancien schema
bunx prisma generate

# 3. Redémarrer serveur
bun run dev
```

Ensuite, appliquer la même migration sur la base de production.

## 🔧 Dépannage

### Erreur: "Table already exists"

Si vous avez déjà poussé le schema multi-tenant:

```bash
# Reset la base (⚠️ EFFACE TOUT!)
bunx prisma migrate reset --force
bunx prisma db push
```

### Erreur: "Connection timeout"

- Vérifier que votre IP est autorisée dans Neon
- Aller dans Settings → IP Allow List

### Base vide après db push

- Vérifier que le bon .env est utilisé
- Vérifier la DATABASE_URL dans .env

## ✅ Checklist

- [ ] Nouvelle base Neon créée
- [ ] URLs copiées
- [ ] Fichier .env.test créé
- [ ] Basculé vers nouvelle base
- [ ] `prisma db push` réussi
- [ ] Données de test créées
- [ ] Application démarre sans erreur
- [ ] Login fonctionne
- [ ] Prêt pour migration multi-tenant

---

## 📞 Aide

Si besoin:
1. Vérifier logs serveur
2. Ouvrir Prisma Studio pour voir les tables
3. Tester connexion DB avec `bunx prisma db pull`

**Une fois la nouvelle base prête, dites-moi et on lance la migration multi-tenant!** 🚀
