# 🚀 Guide de Déploiement Vercel - Gestion Dattes

## ✅ État Actuel

- ✅ Code migré vers Next.js 16 (proxy.ts au lieu de middleware.ts)
- ✅ Build passe localement sans erreurs
- ✅ Prisma 7 configuré avec Neon adapter
- ✅ Configuration Vercel prête

## 🔧 Étapes de Déploiement

### 1. Configuration des Variables d'Environnement dans Vercel

**CRITIQUE**: Le build échoue car `DATABASE_URL` n'est pas défini. Vous devez ajouter ces variables dans Vercel Dashboard.

#### Accéder aux Variables d'Environnement

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet **GestionDattes**
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les 4 variables suivantes:

#### Variables à Ajouter

```env
# 1. DATABASE_URL (POOLED CONNECTION - OBLIGATOIRE)
# Utilisez l'URL avec "-pooler" pour les connexions d'application
DATABASE_URL
postgresql://neondb_owner:npg_Xsv6pBKUH7zS@ep-shiny-night-ah5a382i-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# 2. DIRECT_URL (DIRECT CONNECTION - OBLIGATOIRE)
# Pour Prisma CLI (migrations)
DIRECT_URL
postgresql://neondb_owner:npg_Xsv6pBKUH7zS@ep-shiny-night-ah5a382i.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# 3. AUTH_SECRET (OBLIGATOIRE - GÉNÉRER UN NOUVEAU)
# NE PAS utiliser celui du .env local en production
# Générez-en un nouveau avec: openssl rand -base64 32
AUTH_SECRET
[GÉNÉRER_AVEC: openssl rand -base64 32]

# 4. NEXTAUTH_URL (OBLIGATOIRE)
# URL de votre application Vercel (après déploiement)
NEXTAUTH_URL
https://votre-app.vercel.app
```

#### Comment Générer AUTH_SECRET

**Windows (PowerShell)**:
```powershell
# Installez OpenSSL si nécessaire
# Puis exécutez:
openssl rand -base64 32
```

**Ou utilisez Node.js**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Configuration des Environnements

Pour chaque variable, sélectionnez les environnements:
- ✅ **Production**
- ✅ **Preview** (optionnel)
- ✅ **Development** (optionnel)

### 2. Redéployer l'Application

Après avoir ajouté les variables:

1. **Option 1 - Depuis le Dashboard**:
   - Allez dans **Deployments**
   - Cliquez sur les 3 points du dernier déploiement
   - Cliquez sur **Redeploy**
   - Sélectionnez **Use existing Build Cache**

2. **Option 2 - Nouveau Commit**:
   ```bash
   git add .
   git commit -m "fix: Configure Vercel environment variables"
   git push origin main
   ```

### 3. Vérifier le Build

Le build devrait maintenant réussir avec:
```
✓ Generated Prisma Client
✓ Compiled successfully
✓ Collecting page data
✓ Finalizing page optimization
```

## 🔍 Vérification Post-Déploiement

### 1. Tester l'Application

Accédez à votre URL Vercel et testez:

1. **Page de Login**: `https://votre-app.vercel.app/login`
2. **Connexion Admin**: 
   - Email: `admin@dattes.tn`
   - Mot de passe: `admin123`
3. **Dashboard**: `https://votre-app.vercel.app/dashboard`

### 2. Vérifier la Base de Données

La base de données devrait déjà être seeded avec:
- 5 rôles (ADMIN, AGENT, LABORANTIN, RESPONSABLE_STOCK, DIRECTION)
- 4 utilisateurs
- 4 régions
- 4 types de dattes
- 4 types de caisses
- 3 agriculteurs
- 2 clients

### 3. Tester les Fonctionnalités

- ✅ Création d'utilisateurs
- ✅ Gestion des rôles
- ✅ Logs d'audit
- ✅ Navigation dans le dashboard

## ⚠️ Problèmes Courants

### Build Error: "DATABASE_URL is not defined"

**Cause**: Variables d'environnement non configurées dans Vercel
**Solution**: Suivez l'étape 1 ci-dessus

### Error: "Invalid connection string"

**Cause**: URL de base de données incorrecte
**Solution**: 
1. Vérifiez dans [Neon Console](https://console.neon.tech)
2. Copiez l'URL **Pooled connection** pour `DATABASE_URL`
3. Copiez l'URL **Direct connection** pour `DIRECT_URL`

### Session Cookie Not Working

**Cause**: `NEXTAUTH_URL` incorrect
**Solution**: 
1. Utilisez l'URL complète avec `https://`
2. Pas de slash à la fin
3. Exemple: `https://gestion-dattes.vercel.app`

### Middleware Error: "Module not found"

**Cause**: Ancien middleware.ts importait Prisma (incompatible Edge Runtime)
**Solution**: ✅ Déjà corrigé - migrée vers proxy.ts

## 📋 Checklist Finale

Avant de marquer comme terminé:

- [ ] Variables d'environnement ajoutées dans Vercel
- [ ] AUTH_SECRET généré et unique pour production
- [ ] NEXTAUTH_URL correspond à l'URL Vercel
- [ ] Redéploiement effectué
- [ ] Build réussi (pas d'erreurs)
- [ ] Login fonctionne
- [ ] Dashboard accessible
- [ ] Données seeded visibles

## 🎯 Commandes Utiles

### Build Local (Test)
```bash
npm run build
```

### Vérifier Prisma
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Vérifier les Variables
```bash
# Dans le terminal local
echo $DATABASE_URL
```

## 📞 Support

Si le problème persiste:

1. **Logs Vercel**: Consultez les logs détaillés dans Deployments
2. **Neon Status**: Vérifiez [status.neon.tech](https://status.neon.tech)
3. **Vercel Status**: Vérifiez [vercel-status.com](https://www.vercel-status.com)

## 🔄 Next.js 16 Changes

Ce projet utilise **Next.js 16** avec des breaking changes:

- ❌ ~~`middleware.ts`~~ (déprécié)
- ✅ `proxy.ts` (nouveau)
- ✅ Edge Runtime compatible (pas d'import Node.js)
- ✅ Vérification cookie uniquement

## 🎨 Architecture

```
Vercel Edge Network
      ↓
proxy.ts (Edge Runtime)
      ↓
Next.js App Router
      ↓
Server Actions
      ↓
Services (RBAC)
      ↓
Repositories
      ↓
Prisma + Neon (Serverless)
```

---

**Dernière mise à jour**: 28 juin 2026
**Version Next.js**: 16.2.9
**Version Prisma**: 7.8.0
