# 🧪 Test des Formulaires - Guide de Débogage

## 🎯 Objectif

Tester la création d'utilisateurs et de rôles pour identifier pourquoi les formulaires ne fonctionnent pas.

---

## 🔍 Débogage Activé

Un log de débogage a été ajouté dans `src/lib/permissions.ts` :

```typescript
console.log("🔐 Permission check:", {
    permission,
    userRole,
    allowedRoles,
    isAllowed: allowedRoles.includes(userRole as any),
});
```

Ce log affichera dans la console du serveur :
- La permission demandée
- Le rôle de l'utilisateur
- Les rôles autorisés
- Si l'accès est autorisé

---

## 📋 Étapes de Test

### 1. **Connexion**

Connectez-vous avec le compte admin :
```
Email: admin@dattes.tn
Password: admin123
```

### 2. **Aller sur la page Users**

```
http://localhost:3000/dashboard/users
```

### 3. **Cliquer sur "Créer un utilisateur"**

### 4. **Remplir le formulaire**

Exemple :
- Nom : Ahmed Wolf
- Email : ahmeddhib20@gmail.com
- Password : 123456789
- Rôle : Sélectionner un rôle dans la liste

### 5. **Cliquer sur "Créer"**

### 6. **Observer les logs du serveur**

Dans le terminal où `bun run dev` tourne, vous devriez voir :
```
🔐 Permission check: {
  permission: 'users:create',
  userRole: 'ADMIN',
  allowedRoles: [ 'ADMIN' ],
  isAllowed: true
}
```

---

## 🐛 Problèmes Possibles

### Problème 1 : `userRole` ne correspond pas

**Symptôme** :
```
🔐 Permission check: {
  permission: 'users:create',
  userRole: 'Super Admin',  // ❌ Pas le bon format
  allowedRoles: [ 'ADMIN' ],
  isAllowed: false
}
```

**Cause** :  
Le rôle stocké en session n'est pas le `name` du Role mais autre chose.

**Solution** :  
Vérifier que `user.role.name` dans `auth.ts` retourne bien "ADMIN", "AGENT", etc.

---

### Problème 2 : `allowedRoles` est vide

**Symptôme** :
```
🔐 Permission check: {
  permission: 'users:create',
  userRole: 'ADMIN',
  allowedRoles: [],  // ❌ Vide
  isAllowed: false
}
```

**Cause** :  
La permission n'est pas définie dans `constants/permissions.ts`.

**Solution** :  
Vérifier que `PERMISSIONS["users:create"]` retourne bien `[ROLES.ADMIN]`.

---

### Problème 3 : Erreur "Non authentifié"

**Symptôme** :  
Aucun log n'apparaît, toast "Non authentifié".

**Cause** :  
La session NextAuth n'est pas valide.

**Solution** :  
1. Se déconnecter
2. Se reconnecter
3. Vérifier que le cookie de session existe

---

### Problème 4 : Toast d'erreur sans log

**Symptôme** :  
Toast "Erreur lors de la création" mais aucun log dans le serveur.

**Cause** :  
L'erreur se produit avant `requirePermission` (validation Zod, etc.).

**Solution** :  
Vérifier les champs du formulaire :
- Email valide
- Password min 6 caractères
- RoleId sélectionné

---

## 🔧 Vérifications Manuelles

### Vérifier la session

Ajoutez un console.log dans `CreateUserDialog.tsx` :

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📤 Envoi des données:", formData);
    // ...
}
```

### Vérifier les constants

Dans `src/constants/permissions.ts` :
```typescript
export const PERMISSIONS = {
    "users:create": [ROLES.ADMIN],  // ✅ Doit contenir ADMIN
    // ...
}
```

Dans `src/constants/roles.ts` :
```typescript
export const ROLES = {
    ADMIN: "ADMIN",  // ✅ Doit correspondre au name en DB
    // ...
}
```

### Vérifier la DB

Dans Prisma Studio (`bunx prisma studio`) :
1. Ouvrir la table `Role`
2. Vérifier qu'il existe un rôle avec `name = "ADMIN"`
3. Ouvrir la table `User`
4. Vérifier que l'utilisateur admin a `roleId` pointant vers le rôle ADMIN

---

## 📊 Résultats Attendus

### Succès ✅

**Logs serveur** :
```
🔐 Permission check: {
  permission: 'users:create',
  userRole: 'ADMIN',
  allowedRoles: [ 'ADMIN' ],
  isAllowed: true
}
POST /dashboard/users 200 in 500ms
```

**UI** :
- Toast vert "Utilisateur créé avec succès"
- Dialog se ferme
- Table se rafraîchit avec le nouvel utilisateur

---

### Échec ❌

**Logs serveur** :
```
🔐 Permission check: {
  permission: 'users:create',
  userRole: 'ADMIN',
  allowedRoles: [ 'ADMIN' ],
  isAllowed: false  // ❌
}
POST /dashboard/users 200 in 20ms
```

**UI** :
- Toast rouge "Permission refusée: users:create. Votre rôle (ADMIN) n'a pas accès."
- Dialog reste ouvert

---

## 🚀 Après le Test

Une fois que vous avez les logs, partagez-les pour diagnostic :

```
🔐 Permission check: {
  permission: '...',
  userRole: '...',
  allowedRoles: [ ... ],
  isAllowed: ...
}
```

---

## 📝 Notes

- Les logs apparaissent dans le terminal où `bun run dev` tourne
- Si aucun log n'apparaît, l'erreur se produit avant `requirePermission`
- Le débogage sera retiré une fois le problème résolu

---

**Date** : 27 juin 2026  
**Serveur** : http://localhost:3000
