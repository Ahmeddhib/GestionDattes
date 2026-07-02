# 🚀 Guide de Déploiement sur Vercel

## 📋 Prérequis

1. ✅ Compte Vercel (gratuit)
2. ✅ Projet GitHub connecté à Vercel
3. ✅ Base de données Neon PostgreSQL configurée

---

## 🔧 Configuration des Variables d'Environnement

### Étape 1: Accéder aux Settings Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet **GestionDattes**
3. Cliquez sur **Settings** → **Environment Variables**

### Étape 2: Ajouter les Variables

Ajoutez **3 variables obligatoires** :

#### 1️⃣ DATABASE_URL (Pooled Connection)

```
DATABASE_URL
```
**Valeur** :
```
postgresql://neondb_owner:npg_Xsv6pBKUH7zS@ep-shiny-night-ah5a382i-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

⚠️ **IMPORTANT** : Notez le `-pooler` dans l'URL et `&channel_binding=require` à la fin

**Environnements** : ✅ Production + ✅ Preview + ✅ Development

---

#### 2️⃣ DIRECT_URL (Direct Connection)

```
DIRECT_URL
```
**Valeur** :
```
postgresql://neondb_owner:npg_Xsv6pBKUH7zS@ep-shiny-night-ah5a382i.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

⚠️ **IMPORTANT** : Pas de `-pooler` ici, mais avec `&channel_binding=require`

**Environnements** : ✅ Production + ✅ Preview + ✅ Development

---

#### 3️⃣ AUTH_SECRET (NextAuth Secret Key)

```
AUTH_SECRET
```

**Valeur** : Générez une clé secrète avec une de ces commandes :

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Exemple de résultat :
```
Kx8j2F9mP3nQ7sT1vU5wX8zA0bC4dE6fG9hI2jK5lM7=
```

**Environnements** : ✅ Production + ✅ Preview + ✅ Development

---

#### 4️⃣ NEXTAUTH_URL (OPTIONNEL)

⚠️ **Vercel détecte automatiquement l'URL** - Ne l'ajoutez **QUE** si vous utilisez un domaine custom !

Si vous avez un domaine custom :
```
NEXTAUTH_URL
```
**Valeur** :
```
https://votre-domaine-custom.com
```

**Environnements** : ✅ Production uniquement

---

## 🗄️ Préparation de la Base de Données

**AVANT LE PREMIER DÉPLOIEMENT**, votre base de données Neon doit contenir les tables.

### Option A : Depuis votre machine locale

```bash
# 1. Assurez-vous d'avoir DIRECT_URL dans votre .env local
DIRECT_URL="postgresql://neondb_owner:npg_Xsv6pBKUH7zS@ep-shiny-night-ah5a382i.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# 2. Créer les tables
bun prisma db push

# 3. Initialiser les données (Rôles + Admin)
bun prisma db seed
```

### Option B : Depuis Neon SQL Editor

1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Sélectionnez votre projet **ep-shiny-night-ah5a382i**
3. Cliquez sur **SQL Editor**
4. Exécutez le script SQL de création des tables (demandez-le si besoin)

---

## 🚢 Déploiement

### Méthode 1 : Depuis GitHub (Automatique)

1. Commitez et poussez vos changements sur GitHub
```bash
git add .
git commit -m "Configuration Vercel + Multi-tenant"
git push origin main
```

2. Vercel détecte automatiquement le push et lance le déploiement

### Méthode 2 : Depuis Vercel Dashboard (Manuel)

1. Allez sur votre projet Vercel
2. Cliquez sur **Deployments**
3. Cliquez sur **Redeploy** sur le dernier déploiement
4. Cochez **Use existing Build Cache** (optionnel)
5. Cliquez sur **Redeploy**

---

## ✅ Vérification du Déploiement

### 1. Vérifier le Build

Le build doit afficher :
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### 2. Tester l'Application

1. Ouvrez l'URL de production (ex: `https://votre-app.vercel.app`)
2. Vous devriez voir la **page de sélection des Wakalas**
3. Cliquez sur une Wakala (MAIN ou TUN-NORD)
4. Connectez-vous avec : `admin@dattes.tn` / `admin123`
5. Vérifiez que le **Dashboard s'affiche**

---

## 🐛 Dépannage

### Erreur : "Table does not exist"

**Cause** : Les tables ne sont pas créées dans Neon

**Solution** :
```bash
# En local avec DIRECT_URL configuré
bun prisma db push
bun prisma db seed
```

### Erreur : "INVALID_CREDENTIALS" ou "TENANT_ACCESS_DENIED"

**Cause** : Les données seed n'ont pas été exécutées

**Solution** :
```bash
bun prisma db seed
```

### Erreur : "channel_binding error"

**Cause** : Il manque `&channel_binding=require` dans DATABASE_URL ou DIRECT_URL

**Solution** : Vérifiez que TOUTES vos URLs dans Vercel se terminent par :
```
?sslmode=require&channel_binding=require
```

### Build échoue sur "Dynamic server usage"

**Cause** : Avertissement normal pour les pages avec authentification

**Solution** : Aucune action requise - le build devrait quand même réussir

---

## 📊 Données de Test

**Admin par défaut** :
- Email : `admin@dattes.tn`
- Password : `admin123`
- Accès : Les 2 Wakalas (MAIN + TUN-NORD)

**Wakalas disponibles** :
1. **MAIN** - Wakala Principale (default-tenant-id)
2. **TUN-NORD** - Wakala Tunis Nord (8f5e26df-44cd-4d5b-ad37-ee2807c2dd8f)

---

## 🔒 Sécurité en Production

⚠️ **AVANT LA MISE EN PRODUCTION** :

1. ✅ Changez `AUTH_SECRET` avec une vraie clé aléatoire
2. ✅ Changez le mot de passe admin par défaut
3. ✅ Activez HTTPS uniquement (Vercel le fait automatiquement)
4. ✅ Vérifiez que vos URLs Neon utilisent `sslmode=require`
5. ✅ Ne commitez JAMAIS les fichiers `.env` sur GitHub

---

## 📝 Checklist de Déploiement

- [ ] Variables d'environnement configurées dans Vercel
- [ ] `DATABASE_URL` avec `-pooler` et `&channel_binding=require`
- [ ] `DIRECT_URL` sans `-pooler` et avec `&channel_binding=require`
- [ ] `AUTH_SECRET` généré avec une clé aléatoire
- [ ] Tables créées dans Neon (`bun prisma db push`)
- [ ] Données seed insérées (`bun prisma db seed`)
- [ ] Code pushé sur GitHub
- [ ] Build Vercel réussi ✓
- [ ] Application accessible en ligne
- [ ] Connexion admin testée
- [ ] Dashboard fonctionne

---

## 🎉 Félicitations !

Votre application multi-tenant est maintenant déployée en production ! 🚀

Pour toute question, référez-vous à :
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Neon](https://neon.tech/docs)
- [Documentation Next.js](https://nextjs.org/docs)
