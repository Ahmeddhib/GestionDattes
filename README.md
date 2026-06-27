# 🌴 Gestion Dattes - ERP pour la Production de Dattes

Système ERP moderne pour la gestion complète de la production et distribution de dattes en Tunisie.

![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black)
![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2D3748)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

## ✨ Fonctionnalités

### Gestion des Utilisateurs
- ✅ Création, modification, suppression
- ✅ Activation/désactivation des comptes
- ✅ Attribution de rôles
- ✅ Recherche et pagination avancées
- ✅ Avatars avec initiales colorées

### Gestion des Rôles
- ✅ Système RBAC complet
- ✅ 5 rôles prédéfinis (SUPER_ADMIN, ADMIN, DIRECTEUR, GESTIONNAIRE, LABORANTIN)
- ✅ Permissions granulaires
- ✅ Protection contre suppression si utilisateurs associés

### Journal d'Audit
- ✅ Traçabilité complète des actions
- ✅ 8 types d'actions (CREATE_USER, UPDATE_USER, etc.)
- ✅ Filtrage et pagination
- ✅ Historique permanent

### Dashboard
- ✅ Vue d'ensemble avec 4 statistiques clés
- ✅ Navigation intuitive avec breadcrumb
- ✅ Design moderne "Dattes" (amber/brown)

## 🎨 Design System

### Palette Dattes
```css
Sand Background: #FAF0DC
Primary Amber: #C17A2B
Primary Dark: #8B4A0F
Espresso Sidebar: #3D1C00
Border: #F0E0C0
```

### Principes
- Avatars carrés (8px radius)
- Cards (14px radius)
- Buttons (9px radius)
- Inputs (7px radius)
- Couleurs chaleureuses inspirées des dattes

## 🏗️ Architecture

### Stack Technique
- **Framework**: Next.js 16 (App Router + Turbopack)
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma 7 avec Adapter Neon
- **Auth**: NextAuth v5
- **UI**: Tailwind CSS 4 + Shadcn UI
- **Validation**: Zod 4
- **Dates**: date-fns 4
- **Runtime**: Bun

### Flux de Données
```
User → Server Action → Service → Repository → Prisma → PostgreSQL
```

### Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Routes publiques
│   └── (dashboard)/       # Routes protégées
├── actions/               # Server Actions (mutations)
├── services/              # Logique métier + RBAC + Audit
├── repositories/          # Accès données Prisma
├── validators/            # Schémas Zod
├── components/
│   ├── shared/           # Composants réutilisables
│   ├── features/         # Composants par feature
│   └── ui/               # Shadcn (ne pas modifier)
├── lib/                   # Utilitaires système
└── constants/             # Constantes application
```

## 🚀 Démarrage Rapide

### Prérequis
- Bun 1.3+ ([installer](https://bun.sh))
- PostgreSQL (Neon recommandé)
- Node.js 20+ (pour compatibilité)

### Installation

```bash
# Cloner le projet
git clone <repo-url>
cd gestion-dattes

# Installer les dépendances
bun install

# Configurer .env
cp .env.example .env
# Éditer .env avec vos credentials

# Générer le client Prisma
bunx prisma generate

# Appliquer les migrations
bunx prisma migrate deploy

# Seeder la base (admin@dattes.tn / admin123)
bunx prisma db seed

# Lancer le dev server
bun run dev
```

L'application sera accessible sur `http://localhost:3000`

### Credentials par Défaut
```
Email: admin@dattes.tn
Password: admin123
```

⚠️ Changer ces credentials après la première connexion !

## 📦 Scripts Disponibles

```bash
bun run dev        # Serveur développement
bun run build      # Build production
bun run start      # Serveur production
bun run lint       # Linter
```

### Prisma
```bash
bunx prisma generate      # Générer client
bunx prisma migrate dev   # Créer migration
bunx prisma migrate deploy # Appliquer migrations
bunx prisma db seed       # Seeder
bunx prisma studio        # GUI database
```

## 🔐 Permissions & Rôles

### Matrice de Permissions

| Permission | SUPER_ADMIN | ADMIN | DIRECTEUR | GESTIONNAIRE | LABORANTIN |
|-----------|-------------|-------|-----------|--------------|------------|
| users:* | ✅ | ✅ | ❌ | ❌ | ❌ |
| roles:* | ✅ | ✅ | ❌ | ❌ | ❌ |
| audit:read | ✅ | ✅ | ✅ | ❌ | ❌ |

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture détaillée
- [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md) - Guide de déploiement
- [REFACTORING_COMPLETE.md](./REFACTORING_COMPLETE.md) - Historique refactoring

## 🧪 Tests

```bash
# Tests unitaires (à venir)
bun test

# Tests E2E (à venir)
bun test:e2e
```

## 🚢 Déploiement

### Vercel (Recommandé)
```bash
# Installer Vercel CLI
bun add -g vercel

# Déployer
vercel
```

### Variables d'Environnement
```env
DATABASE_URL=           # URL Neon pooled
DIRECT_URL=             # URL Neon direct
NEXTAUTH_SECRET=        # openssl rand -base64 32
NEXTAUTH_URL=           # https://your-domain.com
NODE_ENV=production
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Guidelines
- Respecter l'architecture (Actions → Services → Repositories)
- Ajouter `requirePermission()` dans les services
- Logger avec `auditService.log()` après mutations
- Valider avec Zod dans les actions
- Suivre le design system Dattes

## 📝 License

MIT

## 👥 Auteurs

- Développé pendant le stage 2ème année ESPRIT
- Juin 2026

## 🙏 Remerciements

- Next.js team pour le framework
- Prisma team pour l'ORM
- Shadcn pour les composants UI
- Neon pour la database serverless

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Build**: ✅ Passing
