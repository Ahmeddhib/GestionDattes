# 📝 Comment Ajouter les Variables d'Environnement dans Vercel

## 🎯 Guide Pas à Pas avec Images

### Étape 1: Accéder au Dashboard Vercel

1. **Ouvrez votre navigateur** et allez sur: https://vercel.com/login
2. **Connectez-vous** avec votre compte (GitHub, GitLab, ou email)
3. Vous verrez la liste de vos projets

```
┌────────────────────────────────────────┐
│  Vercel Dashboard                      │
├────────────────────────────────────────┤
│  Your Projects:                        │
│                                        │
│  📦 GestionDattes    [View Project]   │  ← CLIQUEZ ICI
│  📦 autre-projet     [View Project]   │
│  📦 mon-site         [View Project]   │
└────────────────────────────────────────┘
```

---

### Étape 2: Ouvrir les Settings du Projet

1. **Cliquez** sur votre projet **GestionDattes**
2. En haut de la page, vous verrez plusieurs onglets
3. **Cliquez** sur l'onglet **"Settings"**

```
┌──────────────────────────────────────────────────────┐
│  GestionDattes                                        │
├──────────────────────────────────────────────────────┤
│  [Overview] [Deployments] [Settings] [Analytics]    │
│                            ^^^^^^^^                   │
│                        CLIQUEZ ICI                    │
└──────────────────────────────────────────────────────┘
```

---

### Étape 3: Naviguer vers Environment Variables

Dans la barre latérale gauche des Settings:

```
┌─────────────────────────────────┐
│  Settings                       │
├─────────────────────────────────┤
│  General                        │
│  Domains                        │
│  Environment Variables          │  ← CLIQUEZ ICI
│  Git                            │
│  Functions                      │
│  Security                       │
│  Advanced                       │
└─────────────────────────────────┘
```

**Cliquez sur "Environment Variables"**

---

### Étape 4: Ajouter Chaque Variable

Vous verrez un bouton **"Add New"** ou **"Add Environment Variable"**

```
┌──────────────────────────────────────────────────┐
│  Environment Variables                           │
├──────────────────────────────────────────────────┤
│                                                  │
│  No environment variables yet.                   │
│                                                  │
│  [+ Add New]  ← CLIQUEZ ICI                     │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### Étape 5: Remplir la Variable 1 - DATABASE_URL

Un formulaire apparaît avec 3 champs:

```
┌────────────────────────────────────────────────────┐
│  Add Environment Variable                          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Name:                                             │
│  ┌──────────────────────────────────────────────┐ │
│  │ DATABASE_URL                                 │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Value:                                            │
│  ┌──────────────────────────────────────────────┐ │
│  │ postgresql://neondb_owner:npg_Xsv6pBKUH7zS@  │ │
│  │ ep-shiny-night-ah5a382i-pooler.c-3.us-east-  │ │
│  │ 1.aws.neon.tech/neondb?sslmode=require       │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Environments:                                     │
│  ☑ Production    ☑ Preview    ☑ Development      │
│  ^               ^             ^                   │
│  COCHEZ LES 3 CASES                               │
│                                                    │
│  [Cancel]  [Save]  ← CLIQUEZ SAVE                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Copiez-collez exactement:**

**Name:** 
```
DATABASE_URL
```

**Value:**
```
postgresql://neondb_owner:npg_Xsv6pBKUH7zS@ep-shiny-night-ah5a382i-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Environments:** ✅ Cochez les 3 cases (Production, Preview, Development)

**Cliquez "Save"**

---

### Étape 6: Ajouter Variable 2 - DIRECT_URL

Cliquez à nouveau sur **[+ Add New]**

**Name:**
```
DIRECT_URL
```

**Value:**
```
postgresql://neondb_owner:npg_Xsv6pBKUH7zS@ep-shiny-night-ah5a382i.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Environments:** ✅ Cochez les 3 cases

**Cliquez "Save"**

---

### Étape 7: Générer AUTH_SECRET

Avant d'ajouter AUTH_SECRET, vous devez le générer.

**Ouvrez un terminal** et exécutez:

```bash
node scripts/generate-auth-secret.js
```

Vous verrez quelque chose comme:
```
🔐 Génération AUTH_SECRET pour NextAuth

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Votre nouveau AUTH_SECRET:

  GD4Bhu2GUqWgX7EQhvWralMKGo9jpW+IopnZCkFv3tI=
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  COPIEZ CE SECRET
```

**📋 Copiez ce secret** (il sera différent à chaque fois)

---

### Étape 8: Ajouter Variable 3 - AUTH_SECRET

Retournez dans Vercel, cliquez **[+ Add New]**

**Name:**
```
AUTH_SECRET
```

**Value:**
```
[COLLEZ LE SECRET QUE VOUS AVEZ COPIÉ]
```

Par exemple:
```
GD4Bhu2GUqWgX7EQhvWralMKGo9jpW+IopnZCkFv3tI=
```

**Environments:** ✅ Cochez les 3 cases

**Cliquez "Save"**

---

### Étape 9: Ajouter Variable 4 - NEXTAUTH_URL

Cliquez **[+ Add New]**

**Name:**
```
NEXTAUTH_URL
```

**Value:**
```
https://votre-projet.vercel.app
```

⚠️ **IMPORTANT:** Remplacez `votre-projet` par le vrai nom de votre projet Vercel.

Pour trouver votre URL:
1. Allez dans l'onglet **"Overview"** ou **"Deployments"**
2. Vous verrez l'URL en haut, par exemple: `gestion-dattes-git-main-ahmeddhib.vercel.app`
3. Utilisez cette URL avec `https://`

**Exemple:**
```
https://gestion-dattes-git-main-ahmeddhib.vercel.app
```

**Environments:** ✅ Cochez les 3 cases

**Cliquez "Save"**

---

### Étape 10: Vérifier que Tout est Ajouté

Après avoir ajouté les 4 variables, vous devriez voir:

```
┌──────────────────────────────────────────────────────┐
│  Environment Variables                               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  🔐 DATABASE_URL                                     │
│  Value: postgresql://neondb_owner... (hidden)       │
│  Environments: Production, Preview, Development      │
│  [Edit] [Delete]                                     │
│                                                      │
│  🔐 DIRECT_URL                                       │
│  Value: postgresql://neondb_owner... (hidden)       │
│  Environments: Production, Preview, Development      │
│  [Edit] [Delete]                                     │
│                                                      │
│  🔐 AUTH_SECRET                                      │
│  Value: ********** (hidden)                         │
│  Environments: Production, Preview, Development      │
│  [Edit] [Delete]                                     │
│                                                      │
│  🔐 NEXTAUTH_URL                                     │
│  Value: https://gestion-dattes-git... (hidden)      │
│  Environments: Production, Preview, Development      │
│  [Edit] [Delete]                                     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

✅ **Vous devez voir 4 variables!**

---

### Étape 11: Redéployer l'Application

Maintenant que les variables sont ajoutées, **redéployez**:

**Option A - Depuis Vercel Dashboard:**
1. Allez dans l'onglet **"Deployments"**
2. Trouvez le dernier déploiement qui a échoué
3. Cliquez sur les **3 petits points** (⋮) à droite
4. Cliquez **"Redeploy"**
5. Cochez **"Use existing Build Cache"** (optionnel)
6. Cliquez **"Redeploy"**

```
┌──────────────────────────────────────────────────┐
│  Deployments                                     │
├──────────────────────────────────────────────────┤
│                                                  │
│  ⚠️ main (f1bf47d) - Failed     ⋮  ← CLIQUEZ   │
│     2 minutes ago                   │           │
│                               ┌─────┴────────┐  │
│                               │ Redeploy     │  │
│                               │ View Source  │  │
│                               │ Delete       │  │
│                               └──────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Option B - Nouveau Commit Git:**
```bash
git add .
git commit -m "fix: Add Vercel environment variables"
git push origin main
```

---

### Étape 12: Attendre le Build (3-5 minutes)

Vercel va construire votre application. Vous verrez:

```
Building...
▶ Running "prisma generate && next build"
✓ Generated Prisma Client
✓ Compiled successfully
✓ Collecting page data
✓ Build completed successfully
```

---

### Étape 13: Tester l'Application

Une fois le déploiement réussi (voyez **"Ready"** avec ✅):

1. **Cliquez** sur le lien de déploiement
2. Vous serez redirigé vers votre site
3. **Testez** le login:
   - Email: `admin@dattes.tn`
   - Mot de passe: `admin123`
4. **Vérifiez** que le dashboard fonctionne

---

## 📋 Récapitulatif - Les 4 Variables à Ajouter

| Variable        | Valeur à Copier                                                                                                   |
|----------------|-------------------------------------------------------------------------------------------------------------------|
| `DATABASE_URL`  | `postgresql://neondb_owner:npg_Xsv6pBKUH7zS@ep-shiny-night-ah5a382i-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL`    | `postgresql://neondb_owner:npg_Xsv6pBKUH7zS@ep-shiny-night-ah5a382i.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET`   | *Générer avec* `node scripts/generate-auth-secret.js`                                                           |
| `NEXTAUTH_URL`  | `https://votre-url.vercel.app` *(votre vraie URL Vercel)*                                                       |

---

## ❓ FAQ

### Q: Où trouver mon URL Vercel?
**R:** Dans l'onglet "Deployments", cliquez sur un déploiement, l'URL est en haut de la page.

### Q: Les variables sont-elles sensibles à la casse?
**R:** Oui! Utilisez exactement `DATABASE_URL` (majuscules), pas `database_url`.

### Q: Je ne vois pas le bouton "Add New"?
**R:** Assurez-vous d'être dans Settings → Environment Variables. Peut-être que vous n'avez pas les permissions (demandez au propriétaire du projet).

### Q: Dois-je redémarrer quelque chose?
**R:** Non, après avoir cliqué "Save", les variables sont actives. Vous devez juste redéployer.

### Q: Combien de temps prend le build?
**R:** Généralement 3-5 minutes pour un build complet.

---

## ⚠️ Erreurs Courantes

### Erreur: "DATABASE_URL is not defined"
→ Vous avez oublié d'ajouter `DATABASE_URL` dans Vercel
→ Ou vous avez oublié de cocher "Production"

### Erreur: "Invalid connection string"
→ L'URL est incorrecte ou mal copiée
→ Vérifiez qu'il n'y a pas d'espaces ou de retours à la ligne

### Erreur: "Session not found"
→ `NEXTAUTH_URL` est incorrect
→ Doit commencer par `https://` (pas `http://`)
→ Pas de slash `/` à la fin

---

**Besoin d'aide visuelle?**
Vercel a aussi une documentation officielle: https://vercel.com/docs/projects/environment-variables

**Date**: 28 juin 2026  
**Version**: Next.js 16.2.9
