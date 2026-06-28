# 🚀 Guide de Déploiement Vercel

## ✅ Corrections Appliquées pour Vercel

### Problème : Edge Runtime et Prisma
**Erreur** : `Module not found: Can't resolve '@neondatabase/serverless'` dans le middleware

**Cause** : Le middleware Next.js utilise Edge Runtime qui ne supporte pas tous les modules Node.js. Le middleware importait `auth.ts` qui importait `prisma.ts`, créant une chaîne d'imports incompatible avec Edge Runtime.

**Solution** : Simplifier le middleware pour qu'il vérifie uniquement le cookie de session NextAuth, sans importer Prisma ou auth.

---

## 📁 Fichiers Créés/Modifiés

### 1. `src/middleware.ts` ✅ SIMPLIFIÉ
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "@/lib/routes";

export function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    
    // Vérifier si l'utilisateur a un token de session NextAuth
    const sessionToken = req.cookies.get("authjs.session-token") || 
                        req.cookies.get("__Secure-authjs.session-token");
    const isLoggedIn = !!sessionToken;

    // Redirect to login if not authenticated
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
```

**Avantages** :
- ✅ Aucune dépendance vers Prisma ou modules Node.js
- ✅ Compatible Edge Runtime
- ✅ Rapide et léger
- ✅ Vérifie la session NextAuth via cookie

### 3. `vercel.json` ✨ NOUVEAU
```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install"
}
```

### 4. `package.json` ✅ MODIFIÉ
```json
{
  "scripts": {
    "build": "prisma generate && next build",  // ← Ajouté prisma generate
    "postinstall": "prisma generate"           // ← Nouveau script
  }
}
```

---

## 🔧 Variables d'Environnement Vercel

Dans le dashboard Vercel, ajoutez ces variables :

```env
# Database (Neon)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="votre-secret-aleatoire-ici"
NEXTAUTH_URL="https://votre-domaine.vercel.app"

# Node Environment
NODE_ENV="production"
```

### Générer NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

---

## 📋 Étapes de Déploiement

### 1. **Push vers GitHub**
```bash
git add .
git commit -m "Fix: Edge Runtime compatibility for Vercel"
git push origin main
```

### 2. **Importer sur Vercel**
1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer sur "Add New Project"
3. Importer votre repo GitHub
4. Vercel détectera automatiquement Next.js

### 3. **Configurer les Variables d'Environnement**
1. Aller dans "Settings" > "Environment Variables"
2. Ajouter toutes les variables listées ci-dessus
3. Cliquer sur "Save"

### 4. **Déployer**
1. Aller dans "Deployments"
2. Cliquer sur "Redeploy" ou push un nouveau commit
3. Attendre la fin du build (~2-3 minutes)

---

## 🐛 Résolution des Problèmes

### Erreur : "prisma generate" échoue

**Solution** : Vérifier que `prisma` est dans `devDependencies` :
```json
{
  "devDependencies": {
    "prisma": "^7.8.0"
  }
}
```

### Erreur : "Module not found" pour Prisma

**Solution** : Le script `postinstall` devrait générer automatiquement. Si non, ajoutez dans vercel.json :
```json
{
  "buildCommand": "prisma generate && next build"
}
```

### Erreur : Base de données non accessible

**Solution** : Vérifier que `DATABASE_URL` est bien configuré dans Vercel avec l'URL de connexion pooling de Neon.

### Erreur : NextAuth session invalide

**Solution** : Vérifier que :
1. `NEXTAUTH_SECRET` est défini
2. `NEXTAUTH_URL` pointe vers votre domaine Vercel
3. Les deux variables sont dans "Production" environment

---

## ✅ Checklist Pre-Déploiement

- [ ] `auth-edge.ts` créé
- [ ] `middleware.ts` modifié pour utiliser `authEdge`
- [ ] `vercel.json` créé
- [ ] Script `postinstall` ajouté dans `package.json`
- [ ] Script `build` mis à jour avec `prisma generate`
- [ ] Build local réussi (`bun run build`)
- [ ] Toutes les variables d'environnement notées
- [ ] Code pushé sur GitHub

---

## 🎯 Post-Déploiement

### 1. Seed la Base de Données
Après le premier déploiement, seedez votre DB :

```bash
# Localement avec l'URL de production
DATABASE_URL="votre-url-production" bunx prisma db seed
```

Ou créez un script API pour le faire :
```typescript
// app/api/seed/route.ts
export async function POST() {
  // Code de seed ici
  // Protégé par un secret
}
```

### 2. Tester l'Application
1. Aller sur `https://votre-app.vercel.app`
2. Se connecter avec `admin@dattes.tn` / `admin123`
3. Tester la création d'utilisateurs et de rôles

### 3. Configurer un Domaine Personnalisé (Optionnel)
1. Vercel Settings > Domains
2. Ajouter votre domaine
3. Suivre les instructions DNS

---

## 📊 Monitoring

### Logs
- Vercel Dashboard > Deployments > Cliquer sur un déploiement > "View Function Logs"

### Erreurs
- Vercel Dashboard > Analytics > "Errors"

### Performance
- Vercel Dashboard > Analytics > "Performance"

---

## 🔄 Mises à Jour Futures

Pour déployer une mise à jour :
```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

Vercel redéploiera automatiquement !

---

## 📝 Notes Importantes

### Edge Runtime vs Node.js Runtime
- **Middleware** : Edge Runtime (limité, pas de Prisma direct)
- **Pages** : Node.js Runtime (complet, Prisma OK)
- **API Routes** : Node.js Runtime (complet, Prisma OK)

### Prisma avec Neon
- Utiliser `@prisma/adapter-neon` pour la compatibilité serverless
- Pool de connexions géré par Neon
- Pas besoin de `prisma.$connect()` / `$disconnect()`

### Cold Starts
- Première requête après inactivité : ~2-3s
- Requêtes suivantes : ~100-300ms
- Normal pour les applications serverless

---

## 🎉 Résultat Attendu

Une fois déployé, vous aurez :
- ✅ Application Next.js 16 sur Vercel
- ✅ Base de données PostgreSQL sur Neon
- ✅ Authentication NextAuth avec JWT
- ✅ HTTPS automatique
- ✅ CDN global
- ✅ Redéploiement automatique sur push
- ✅ Preview deployments sur PR

---

**Date** : 27 juin 2026  
**Version** : 2.0.0  
**Status** : ✅ PRÊT POUR VERCEL
