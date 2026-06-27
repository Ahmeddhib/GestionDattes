# ⚡ Quick Start - Gestion Dattes

## 🚀 Démarrage en 3 Minutes

### 1. Installation (1 min)
```bash
# Installer les dépendances
bun install

# Générer le client Prisma
bunx prisma generate
```

### 2. Base de Données (1 min)
```bash
# Appliquer les migrations
bunx prisma migrate deploy

# Créer l'admin (admin@dattes.tn / admin123)
bunx prisma db seed
```

### 3. Lancer l'App (30s)
```bash
# Démarrer le serveur
bun run dev
```

✅ Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 🔑 Credentials par Défaut

```
Email: admin@dattes.tn
Password: admin123
```

⚠️ **IMPORTANT**: Changer ces credentials après la première connexion !

---

## 📍 Navigation

### Dashboard
- **URL**: `/dashboard`
- **Fonctionnalité**: Vue d'ensemble avec 4 statistiques

### Utilisateurs
- **URL**: `/dashboard/users`
- **Fonctionnalités**:
  - ➕ Créer un utilisateur
  - ✏️ Modifier un utilisateur
  - ✅/❌ Activer/Désactiver
  - 🗑️ Supprimer (avec protection)
  - 🔍 Recherche et pagination

### Rôles
- **URL**: `/dashboard/roles`
- **Fonctionnalités**:
  - ➕ Créer un rôle
  - ✏️ Modifier un rôle
  - 🗑️ Supprimer (si aucun utilisateur)
  - 🔍 Recherche et pagination

### Audit Logs
- **URL**: `/dashboard/audit-logs`
- **Fonctionnalités**:
  - 📜 Historique complet des actions
  - 🔍 Filtrage par utilisateur/action
  - 📄 Pagination (20/page)

---

## 🛠️ Commandes Utiles

### Développement
```bash
bun run dev        # Lancer le serveur dev (http://localhost:3000)
bun run build      # Build pour production
bun run start      # Lancer en mode production
```

### Prisma
```bash
bunx prisma generate      # Générer le client Prisma
bunx prisma studio        # Ouvrir l'UI de la DB (http://localhost:5555)
bunx prisma migrate dev   # Créer une nouvelle migration
bunx prisma db push       # Push schema sans migration
bunx prisma db seed       # Re-seeder la DB
```

### Database Reset (⚠️ Attention)
```bash
bunx prisma migrate reset  # Reset complet + seed
```

---

## 🧪 Tester les Fonctionnalités

### 1. Créer un Utilisateur
1. Aller sur `/dashboard/users`
2. Cliquer "Nouvel utilisateur"
3. Remplir le formulaire
4. Sélectionner un rôle
5. Valider

### 2. Créer un Rôle
1. Aller sur `/dashboard/roles`
2. Cliquer "Nouveau rôle"
3. Entrer nom + description
4. Valider

### 3. Voir l'Audit
1. Aller sur `/dashboard/audit-logs`
2. Observer toutes les actions effectuées
3. Voir qui a fait quoi et quand

### 4. Activer/Désactiver un Utilisateur
1. Aller sur `/dashboard/users`
2. Cliquer sur l'icône ✅/❌ d'un utilisateur
3. Confirmation automatique avec toast
4. Voir le changement de statut immédiat

---

## 🎨 Personnalisation

### Changer les Couleurs
Éditer `tailwind.config.ts`:
```typescript
dattes: {
  400: "#C17A2B", // Couleur primaire
  600: "#8B4A0F", // Couleur hover
}
```

### Ajouter un Rôle
1. Éditer `src/constants/roles.ts`
2. Ajouter dans `ROLES` array
3. Éditer `src/constants/permissions.ts`
4. Ajouter les permissions du nouveau rôle

### Ajouter une Permission
1. Éditer `src/constants/permissions.ts`
2. Ajouter dans `PERMISSIONS` map
3. Utiliser dans les services avec `requirePermission("new:permission")`

---

## 🐛 Troubleshooting

### Erreur: "Cannot find module '@/generated/prisma'"
```bash
bunx prisma generate
```

### Erreur: "Database connection failed"
Vérifier `.env`:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### Erreur: "NEXTAUTH_SECRET is not defined"
Ajouter dans `.env`:
```bash
# Générer un secret
openssl rand -base64 32

# Ajouter dans .env
NEXTAUTH_SECRET="votre-secret-généré"
```

### Port 3000 déjà utilisé
```bash
# Utiliser un autre port
PORT=3001 bun run dev
```

### Prisma Client out of date
```bash
bunx prisma generate
```

---

## 📚 Ressources

### Documentation Projet
- [README.md](./README.md) - Documentation complète
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture détaillée
- [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md) - Guide déploiement

### Documentation Externe
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [Tailwind Docs](https://tailwindcss.com/docs)

---

## 💬 Support

### Issues Connus
- ⚠️ Middleware deprecation warning → Ignorer (Next.js 16)
- ⚠️ tailwindcss-animate warning → Ignorer (pas critique)

### Questions ?
1. Vérifier [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Vérifier [README.md](./README.md)
3. Vérifier la console pour les erreurs

---

## 🎉 Vous êtes Prêt !

L'application est maintenant fonctionnelle. Explorez les différentes pages et testez les fonctionnalités.

**Bon développement ! 🚀**
