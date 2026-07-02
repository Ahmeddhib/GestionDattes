# 🧪 Guide de Test Multi-Tenant

**Date:** 2 juillet 2026  
**Objectif:** Tester le flux complet multi-tenant

---

## 📋 Pré-requis

- ✅ Serveur Next.js en cours d'exécution (`bun run dev`)
- ✅ Base de données Neon connectée
- ✅ Client Prisma régénéré
- ✅ Tenant par défaut "Wakala Principale" (MAIN) créé

---

## 🚀 Scénario de Test Complet

### Test 1: Page d'Accueil ✅

**URL:** `http://localhost:3000/`

**Résultat attendu:**
- ✅ Page avec gradient `#FAF0DC` → `#F5E6C8`
- ✅ Logo 🌴 en haut
- ✅ Titre "Gestion Dattes"
- ✅ Sous-titre "Plateforme ERP Multi-Wakala"
- ✅ Carte "Wakala Principale" (MAIN) visible
- ✅ Bouton "+ Créer Nouvelle Wakala"

**Actions:**
- Vérifier que la page charge sans erreur
- Observer la carte de la Wakala par défaut

---

### Test 2: Création d'une Nouvelle Wakala

**Étapes:**
1. Cliquer sur "+ Créer Nouvelle Wakala"
2. Remplir le formulaire:
   - **Nom:** Wakala Nord
   - **Code:** TUN-NORD (unique)
   - **Adresse:** Nabeul, Tunisie
   - **Téléphone:** +216 XX XX XX XX
   - **Email:** contact@nord.wakala
3. Cliquer "Créer"

**Résultat attendu:**
- ✅ Dialog se ferme
- ✅ Message de succès avec credentials:
  - Email: `admin@tun-nord.wakala`
  - Password: `Admin@123`
- ✅ Nouvelle carte "Wakala Nord" apparaît dans la grille
- ✅ Page se rafraîchit automatiquement

**Problème possible:**
- Si erreur "code existe déjà" → Changer le code

---

### Test 3: Sélection de Wakala

**Étapes:**
1. Cliquer sur la carte "Wakala Principale"

**Résultat attendu:**
- ✅ Redirection vers `/login`
- ✅ Affichage du nom "Wakala Principale" sur la page login
- ✅ `sessionStorage` contient `selectedWakalaId` et `selectedWakalaCode`

**Vérification dans Console DevTools:**
```javascript
sessionStorage.getItem("selectedWakalaId") // ID de la Wakala
sessionStorage.getItem("selectedWakalaCode") // "MAIN"
```

---

### Test 4: Connexion

**Étapes:**
1. Sur `/login`, saisir:
   - **Email:** `admin@dattes.tn`
   - **Password:** `admin123`
2. Cliquer "Se connecter"

**Résultat attendu:**
- ✅ Authentification réussie
- ✅ Redirection vers `/dashboard`
- ✅ Session contient `tenantId`, `tenantName`, `tenantCode`
- ✅ Sidebar visible avec navigation

**Vérification de Session:**
- Dans React DevTools ou Network tab
- Cookie `authjs.session-token` présent
- JWT contient les infos tenant

**Problème possible:**
- Si erreur `TENANT_SELECTION_REQUIRED` → Retourner à la page d'accueil
- Si erreur `TENANT_ACCESS_DENIED` → Vérifier TenantUser dans DB

---

### Test 5: Navigation Dashboard

**Étapes:**
1. Une fois connecté, aller dans `/dashboard`
2. Vérifier la topbar
3. Vérifier la sidebar

**Résultat attendu:**
- ✅ Nom utilisateur affiché: "Admin System"
- ✅ Wakala affichée: "Wakala Principale"
- ✅ Bouton de langue (FR/AR/EN)
- ✅ Sidebar avec menu:
  - 📊 Dashboard
  - 🌾 Agriculteurs
  - 🗺️ Régions
  - 📦 Type Dates
  - 📦 Type Caisses
  - etc.

---

### Test 6: Gestion des Régions (CRITIQUE)

**Étapes:**
1. Cliquer sur "Régions" dans la sidebar
2. Observer la table des régions
3. Cliquer "+ Nouvelle Région"
4. Remplir:
   - **Nom:** Nabeul
   - **Code:** NAB
5. Créer

**Résultat attendu:**
- ✅ Région créée avec succès
- ✅ Table rafraîchie
- ✅ Nouvelle région visible uniquement dans cette Wakala

**Vérification Isolation:**
- Se déconnecter
- Se connecter à "Wakala Nord" (si créée)
- Aller dans Régions
- Vérifier que "Nabeul" n'apparaît PAS

---

### Test 7: Isolation des Données (TEST CRITIQUE)

**Scénario:**
1. **Wakala A ("Principale"):**
   - Créer région "Nabeul" (NAB)
   - Créer agriculteur "Ahmed" avec CIN "12345678"
   
2. **Se déconnecter**

3. **Wakala B ("Nord"):**
   - Se connecter avec `admin@tun-nord.wakala` / `Admin@123`
   - Aller dans Régions
   - **VÉRIFIER:** "Nabeul" n'apparaît PAS ✅
   - Créer région "Nabeul" (NAB) → Devrait RÉUSSIR ✅
   - Créer agriculteur "Mohamed" avec CIN "12345678" → Devrait RÉUSSIR ✅

**Résultat attendu:**
- ✅ Codes/CIN sont uniques PAR TENANT
- ✅ Données complètement isolées
- ✅ Aucune fuite de données entre Wakalas

**Si ce test échoue:**
- 🚨 **PROBLÈME CRITIQUE DE SÉCURITÉ**
- Vérifier les repositories
- Vérifier les services
- Vérifier `getTenantId()` dans les actions

---

### Test 8: Gestion des Agriculteurs

**Étapes:**
1. Dans une Wakala, aller dans "Agriculteurs"
2. Cliquer "+ Nouvel Agriculteur"
3. Remplir le formulaire:
   - **Code:** AGR001
   - **CIN:** 12345678
   - **Nom:** Ben Ahmed
   - **Prénom:** Mohamed
   - **Téléphone:** +216 XX XX XX XX
   - **Région:** Sélectionner une région existante
   - **Nb Palmiers:** 100
   - **Superficie:** 5.0
4. Créer

**Résultat attendu:**
- ✅ Agriculteur créé
- ✅ Visible uniquement dans cette Wakala
- ✅ Associé à une région du même tenant

**Vérification:**
- Modifier l'agriculteur → Succès
- Supprimer l'agriculteur → Succès (si pas de livraisons)

---

### Test 9: Switch Entre Wakalas

**Étapes:**
1. Étant connecté à Wakala A
2. Retourner à la page d'accueil `/`
3. Cliquer sur Wakala B
4. Rediriger vers login
5. Se connecter avec les credentials de Wakala B

**Résultat attendu:**
- ✅ Session mise à jour avec nouveau `tenantId`
- ✅ Dashboard affiche données de Wakala B
- ✅ Données de Wakala A non visibles

**Note:** Pour l'instant, il faut se déconnecter manuellement.  
**TODO:** Implémenter `WakalaSwitcher` dans TopBar.

---

### Test 10: Multi-Langue

**Étapes:**
1. Dans le TopBar, cliquer sur le bouton langue
2. Sélectionner "AR" (Arabe)

**Résultat attendu:**
- ✅ Interface passe en arabe
- ✅ Direction RTL (texte de droite à gauche)
- ✅ Menu, boutons, labels traduits

**Langues supportées:**
- 🇫🇷 Français (par défaut)
- 🇸🇦 العربية (RTL)
- 🇬🇧 English

---

## 🐛 Dépannage

### Problème 1: Page d'accueil ne charge pas

**Symptômes:**
- Page blanche ou erreur 500
- Console: "Tenant table not found"

**Solution:**
1. Vérifier la connexion DB
2. Exécuter: `bunx prisma generate`
3. Redémarrer le serveur

### Problème 2: Login échoue

**Symptômes:**
- Erreur "TENANT_SELECTION_REQUIRED"
- Erreur "TENANT_ACCESS_DENIED"

**Solution:**
1. Vérifier `sessionStorage` contient `selectedWakalaId`
2. Vérifier que l'utilisateur existe dans `TenantUser`
3. Vérifier la table `TenantUser`:
   ```sql
   SELECT * FROM "TenantUser" 
   WHERE "userId" = 'user-id' 
   AND "tenantId" = 'tenant-id';
   ```

### Problème 3: Données d'une autre Wakala visibles

**🚨 CRITIQUE - FUITE DE DONNÉES**

**Solution:**
1. Vérifier que le repository filtre par `tenantId`
2. Vérifier que le service passe `tenantId`
3. Vérifier que l'action utilise `getTenantId()`
4. Regarder les requêtes SQL dans les logs Prisma

### Problème 4: Erreur Prisma "Unknown field"

**Symptômes:**
- "Unknown field `role`"
- "Unknown field `tenant`"

**Solution:**
- Utiliser les noms avec majuscule: `Role`, `Tenant`, `User`
- Vérifier le schéma Prisma
- Régénérer: `bunx prisma generate`

### Problème 5: Erreur "id is missing"

**Symptômes:**
- "Argument `id` is missing"
- Sur création User ou autre modèle

**Solution:**
- Ajouter `id: createId()` dans les `create()`
- Vérifier que le modèle a `@default(cuid())` ou générer manuellement

---

## 📊 Checklist de Validation

### Sécurité ✅
- [ ] tenantId récupéré depuis session (jamais client)
- [ ] Double vérification ID + tenantId
- [ ] Filtrage systématique par tenantId
- [ ] Codes/CIN uniques par tenant
- [ ] Aucune fuite de données entre tenants

### Fonctionnalités ✅
- [ ] Page d'accueil affiche Wakalas
- [ ] Création de Wakala fonctionne
- [ ] Sélection de Wakala fonctionne
- [ ] Login avec tenantId fonctionne
- [ ] Régions isolées par tenant
- [ ] Agriculteurs isolés par tenant
- [ ] Switch entre Wakalas possible

### Interface ✅
- [ ] Design cohérent (#C17A2B, border-radius 14px)
- [ ] Multi-langue fonctionnel (FR/AR/EN)
- [ ] RTL pour l'arabe
- [ ] Responsive mobile/desktop
- [ ] Messages d'erreur clairs

### Performance ✅
- [ ] Chargement page < 2s
- [ ] Requêtes DB optimisées
- [ ] Pas de N+1 queries
- [ ] Indexes sur tenantId

---

## 🎯 Prochains Tests

### À implémenter
1. **WakalaSwitcher** dans TopBar
   - Dropdown listant les Wakalas de l'utilisateur
   - Switch sans déconnexion

2. **Middleware de protection**
   - Bloquer accès dashboard sans tenantId
   - Rediriger vers `/` si pas de Wakala

3. **Tests automatisés**
   - Tests E2E avec Playwright
   - Tests unitaires repositories
   - Tests isolation données

4. **Autres modules**
   - Type Dates
   - Type Caisses
   - Clients
   - Livraisons
   - Stock
   - Ventes

---

## 📝 Rapport de Test

**À remplir après chaque test:**

| Test | Status | Notes | Date |
|------|--------|-------|------|
| Page accueil | ⏳ | | |
| Création Wakala | ⏳ | | |
| Sélection Wakala | ⏳ | | |
| Login | ⏳ | | |
| Navigation | ⏳ | | |
| Régions | ⏳ | | |
| Isolation données | ⏳ | | |
| Agriculteurs | ⏳ | | |
| Switch Wakalas | ⏳ | | |
| Multi-langue | ⏳ | | |

**Légende:**
- ⏳ En attente
- ✅ Réussi
- ❌ Échec
- ⚠️ Problème mineur

---

**Bonne chance pour les tests !** 🚀
