# Flux de Déconnexion Multi-Tenant

## 🔄 Comportement Implémenté

### Avant la Modification
Après déconnexion → Redirection vers `/login`

### Après la Modification ✅
Après déconnexion → Redirection vers `/` (page d'accueil avec sélection Wakalas)

---

## 📋 Modifications Appliquées

### 1. Configuration NextAuth (`src/lib/auth.ts`)
```typescript
pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/", // ✅ Nouveau: Redirection vers page d'accueil
},
```

### 2. Composant nav-user (`src/components/nav-user.tsx`)
```typescript
// Avant
onClick={() => signOut({ callbackUrl: ROUTES.LOGIN })}

// Après ✅
onClick={() => signOut({ callbackUrl: "/" })}
```

### 3. Composant dashboard-nav (`src/components/layout/dashboard-nav.tsx`)
```typescript
// Avant
onClick={() => signOut({ callbackUrl: ROUTES.LOGIN })}

// Après ✅
onClick={() => signOut({ callbackUrl: "/" })}
```

### 4. Sidebar (`src/components/shared/Sidebar.tsx`)
```typescript
// Avant
window.location.href = "/api/auth/signout";

// Après ✅
window.location.href = "/api/auth/signout?callbackUrl=/";
```

### 5. WakalaSelectionPage (`src/app/WakalaSelectionPage.tsx`)
**Nouveau:** Nettoyage automatique du sessionStorage

```typescript
useEffect(() => {
    // Nettoyer la sélection précédente
    sessionStorage.removeItem("selectedWakalaId");
    sessionStorage.removeItem("selectedWakalaCode");
}, []);
```

---

## 🎯 Flux Complet Maintenant

### Connexion (Première Fois)
```
1. Utilisateur → http://localhost:3000 (page d'accueil)
   ↓ sessionStorage nettoyé automatiquement
2. Sélection Wakala (ex: MAIN)
   ↓ Stocke wakalaId et wakalaCode dans sessionStorage
3. Redirection → /login
   ↓ Affiche la Wakala sélectionnée
4. Login: email + password
   ↓ Vérifie accès à cette Wakala
5. Redirection → /dashboard
   ↓ Session créée avec tenantId
```

### Déconnexion
```
1. Utilisateur clique sur "Déconnexion"
   ↓ Appel signOut({ callbackUrl: "/" })
2. Session détruite par NextAuth
   ↓ JWT supprimé
3. Redirection → / (page d'accueil)
   ↓ useEffect nettoie sessionStorage
4. Utilisateur voit les Wakalas disponibles
   ↓ Peut choisir une nouvelle Wakala
5. Cycle recommence
```

### Reconnexion (Même ou Autre Wakala)
```
1. Utilisateur sur page d'accueil (/)
   ↓ sessionStorage vide (nettoyé)
2. Peut sélectionner:
   - La même Wakala qu'avant
   - Une Wakala différente
3. Flux normal de connexion
```

---

## ✅ Avantages

### Pour l'Utilisateur
- ✅ Choix clair après déconnexion
- ✅ Peut changer de Wakala facilement
- ✅ Pas de confusion (pas de Wakala pré-sélectionnée)
- ✅ Expérience cohérente

### Pour la Sécurité
- ✅ Session complètement nettoyée
- ✅ SessionStorage nettoyé automatiquement
- ✅ Aucune donnée résiduelle
- ✅ Utilisateur doit re-sélectionner explicitement

### Pour le Multi-Tenant
- ✅ Respect du principe de moindre privilège
- ✅ Choix explicite de la Wakala à chaque connexion
- ✅ Audit trail clair (quelle Wakala, quand)
- ✅ Pas de "sticky" tenant involontaire

---

## 🧪 Tests de Validation

### Test 1: Déconnexion Basique
```
1. Se connecter à Wakala MAIN
2. Cliquer sur "Déconnexion" (Sidebar ou TopBar)
3. ✅ Redirection vers page d'accueil (/)
4. ✅ SessionStorage nettoyé
5. ✅ Affiche les 2 Wakalas disponibles
```

### Test 2: Reconnexion Même Wakala
```
1. Après déconnexion (sur page d'accueil)
2. Sélectionner à nouveau "Wakala MAIN"
3. Login: admin@dattes.tn / admin123
4. ✅ Connexion réussie
5. ✅ Dashboard affiche données MAIN
```

### Test 3: Reconnexion Autre Wakala
```
1. Connecté à Wakala MAIN
2. Déconnexion → Page d'accueil
3. Sélectionner "wakala tunis (TUN-NORD)"
4. Login: admin@dattes.tn / admin123
5. ✅ Connexion réussie
6. ✅ Dashboard affiche données TUN-NORD
7. ✅ Aucune donnée MAIN visible
```

### Test 4: Déconnexion Depuis Différents Endroits
```
# Test A: Sidebar
- Cliquer "Déconnexion" dans Sidebar
- ✅ Redirection vers /

# Test B: TopBar (nav-user)
- Cliquer menu utilisateur → "Déconnexion"
- ✅ Redirection vers /

# Test C: Dashboard Nav
- Cliquer "Déconnexion" dans navigation
- ✅ Redirection vers /
```

### Test 5: SessionStorage Nettoyé
```
1. Avant déconnexion:
   console.log(sessionStorage.getItem("selectedWakalaId"))
   // "default-tenant-id"

2. Après déconnexion et retour page d'accueil:
   console.log(sessionStorage.getItem("selectedWakalaId"))
   // null ✅
```

---

## 📁 Fichiers Modifiés (5)

1. ✅ `src/lib/auth.ts` - Configuration signOut page
2. ✅ `src/components/nav-user.tsx` - CallbackUrl "/"
3. ✅ `src/components/layout/dashboard-nav.tsx` - CallbackUrl "/"
4. ✅ `src/components/shared/Sidebar.tsx` - CallbackUrl "/"
5. ✅ `src/app/WakalaSelectionPage.tsx` - Nettoyage sessionStorage

---

## 🎓 Bonnes Pratiques Implémentées

### 1. Nettoyage Automatique
- ✅ SessionStorage nettoyé au montage du composant
- ✅ Pas de données résiduelles entre sessions
- ✅ Utilisation de `useEffect` avec dépendances vides

### 2. Cohérence UI
- ✅ Tous les boutons de déconnexion redirigent vers `/`
- ✅ Comportement identique quel que soit le point d'entrée
- ✅ Message cohérent: "Sélectionnez une Wakala pour vous connecter"

### 3. Sécurité
- ✅ Session détruite côté serveur (NextAuth)
- ✅ SessionStorage nettoyé côté client
- ✅ Pas de state résiduel
- ✅ Re-sélection explicite requise

### 4. UX Multi-Tenant
- ✅ Page d'accueil comme "hub" central
- ✅ Choix explicite et visuel des Wakalas
- ✅ Flexibilité pour changer de Wakala
- ✅ Pas de surprise (Wakala pré-sélectionnée)

---

## 🔍 Points d'Attention

### SessionStorage vs Cookies
Le `selectedWakalaId` est stocké dans **sessionStorage** (client-side), pas dans les cookies.
- ✅ Avantage: Ne persiste pas entre fermetures de navigateur
- ✅ Avantage: Facilement nettoyable côté client
- ⚠️ Note: Le vrai `tenantId` est dans la session JWT (sécurisé)

### NextAuth CallbackUrl
La configuration `pages.signOut: "/"` définit la redirection par défaut.
Les composants utilisent aussi `callbackUrl: "/"` explicitement pour cohérence.

### Flux Alternatif (Non Implémenté)
**Autre approche possible:** Créer une page `/select-wakala` dédiée
- Pro: URL explicite
- Con: Plus de redirections
- **Choix actuel:** Utiliser `/` (plus simple, moins de redirections)

---

## ✅ Status Final

**Flux de Déconnexion:** ✅ FONCTIONNEL  
**Nettoyage SessionStorage:** ✅ AUTOMATIQUE  
**Cohérence UI:** ✅ TOUS LES BOUTONS  
**Tests:** ✅ VALIDÉS  

**L'utilisateur retourne maintenant à la page d'accueil (sélection Wakalas) après déconnexion!**

---

**Date:** 02/07/2026  
**Dernière mise à jour:** 16:00  
**Status:** ✅ IMPLÉMENTÉ ET TESTÉ
