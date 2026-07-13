# 🔐 Guide des Callbacks NextAuth - Gestion Dattes

## 📚 Vue d'ensemble

Ce document explique tous les callbacks NextAuth implémentés dans le projet et comment les utiliser.

---

## 🎯 Callbacks implémentés

### 1. **JWT Callback** ⚡

**Rôle** : Gérer le token JWT et y ajouter des données personnalisées

**Quand est-il appelé ?**
- Lors de la première connexion (avec `user`)
- À chaque requête qui nécessite le token
- Lors des mises à jour de session (`trigger: "update"`)

**Données ajoutées au token** :
```typescript
{
  id: string           // ID utilisateur
  role: string         // Rôle dans la Wakala actuelle
  tenantId?: string    // ID de la Wakala sélectionnée
  tenantName?: string  // Nom de la Wakala
  tenantCode?: string  // Code de la Wakala
}
```

**Cas d'usage** :
- ✅ Premier login : Stocker les infos utilisateur
- ✅ Changement de Wakala : Mettre à jour le tenantId
- ✅ Conservation des données entre les requêtes

**Exemple de mise à jour du tenant** :
```typescript
// Dans ton code client
import { useSession } from "next-auth/react";

const { data: session, update } = useSession();

// Changer de Wakala
await update({
  tenantId: "new-tenant-id",
  tenantName: "Nouvelle Wakala",
  tenantCode: "WK-002",
  role: "AGENT",
});
```

---

### 2. **Session Callback** 📦

**Rôle** : Exposer les données du JWT à la session côté client

**Quand est-il appelé ?**
- À chaque fois que `useSession()` ou `auth()` est appelé
- Lors de la vérification de session

**Données exposées** :
```typescript
session.user = {
  id: string
  email: string
  name: string
  role: string
  tenantId?: string
  tenantName?: string
  tenantCode?: string
}
```

**Cas d'usage** :
- ✅ Accéder aux infos utilisateur côté client
- ✅ Afficher le nom de la Wakala dans l'UI
- ✅ Vérifier le rôle pour afficher/masquer des éléments

**Exemple d'utilisation** :
```typescript
// Dans un composant client
"use client";
import { useSession } from "next-auth/react";

export function UserInfo() {
  const { data: session } = useSession();
  
  if (!session) return null;
  
  return (
    <div>
      <p>Utilisateur : {session.user.name}</p>
      <p>Rôle : {session.user.role}</p>
      <p>Wakala : {session.user.tenantName}</p>
    </div>
  );
}
```

```typescript
// Dans un Server Component
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();
  
  if (!session) redirect("/login");
  
  return (
    <div>
      <h1>Bienvenue {session.user.name}</h1>
      <p>Wakala : {session.user.tenantName}</p>
    </div>
  );
}
```

---

### 3. **SignIn Callback** ✅

**Rôle** : Contrôle d'accès après authentification réussie

**Quand est-il appelé ?**
- Juste après que `authorize()` retourne un utilisateur
- Avant la création du JWT

**Vérifications effectuées** :
1. ✅ Compte utilisateur actif (`user.active = true`)
2. ✅ Accès au tenant si tenantId fourni
3. ✅ TenantUser actif (`tenantUser.active = true`)
4. ✅ Tenant actif (`tenant.active = true`)

**Retour** :
- `true` : Connexion autorisée
- `false` : Connexion bloquée

**Cas d'usage** :
- ✅ Bloquer les comptes désactivés
- ✅ Empêcher l'accès aux Wakalas inactives
- ✅ Contrôle de sécurité supplémentaire

**Exemple de logs** :
```
[SIGNIN] Connexion autorisée pour: user@example.com
[SIGNIN] Compte désactivé: inactive@example.com
[SIGNIN] Accès tenant refusé: { userId: "xxx", tenantId: "yyy" }
```

---

### 4. **Redirect Callback** 🔀

**Rôle** : Personnaliser les redirections après login/logout

**Quand est-il appelé ?**
- Après connexion réussie
- Après déconnexion
- Lors des callbacks OAuth (si utilisé plus tard)

**Logique de redirection** :
```typescript
1. URL relative (ex: "/dashboard") 
   → Redirection vers: https://domain.com/dashboard

2. URL absolue même domaine (ex: "https://domain.com/users")
   → Redirection telle quelle

3. URL externe ou invalide
   → Redirection par défaut: https://domain.com/dashboard
```

**Cas d'usage** :
- ✅ Rediriger vers la sélection de Wakala si pas de tenantId
- ✅ Rediriger vers le dashboard après login
- ✅ Empêcher les redirections vers des sites externes

**Exemple de logs** :
```
[REDIRECT] Redirection demandée: { url: "/dashboard", baseUrl: "http://localhost:3000" }
[REDIRECT] Redirection relative: http://localhost:3000/dashboard
```

---

## 🔄 Flux de connexion complet

### Scénario 1 : Premier login sans Wakala

```
1. Utilisateur entre email/password
   ↓
2. authorize() vérifie les credentials
   ↓
3. signIn() vérifie que le compte est actif
   → Retourne true
   ↓
4. jwt() crée le token SANS tenantId
   ↓
5. session() expose les données
   ↓
6. redirect() → Redirige vers /select-wakala
```

### Scénario 2 : Login avec Wakala sélectionnée

```
1. Utilisateur entre email/password + tenantId
   ↓
2. authorize() vérifie credentials + accès tenant
   ↓
3. signIn() vérifie compte actif + tenant actif
   → Retourne true
   ↓
4. jwt() crée le token AVEC tenantId
   ↓
5. session() expose les données complètes
   ↓
6. redirect() → Redirige vers /dashboard
```

### Scénario 3 : Changement de Wakala

```
1. Utilisateur clique sur "Changer de Wakala"
   ↓
2. update({ tenantId, tenantName, tenantCode, role })
   ↓
3. jwt() avec trigger="update" → Met à jour le token
   ↓
4. session() expose les nouvelles données
   ↓
5. Router.refresh() → Recharge la page avec nouvelle Wakala
```

---

## 🛠️ Utilisation pratique

### Vérifier la session côté serveur

```typescript
// src/actions/exemple.action.ts
"use server";

import { auth } from "@/lib/auth";

export async function monAction() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }
  
  if (!session.user.tenantId) {
    return { success: false, error: "Aucune Wakala sélectionnée" };
  }
  
  // Accéder aux infos
  const userId = session.user.id;
  const tenantId = session.user.tenantId;
  const role = session.user.role;
  
  // Votre logique métier...
}
```

### Vérifier la session côté client

```typescript
// src/components/MonComposant.tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export function MonComposant() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <div>Chargement...</div>;
  }
  
  if (status === "unauthenticated") {
    redirect("/login");
  }
  
  return (
    <div>
      <p>Bonjour {session.user.name}</p>
      <p>Rôle : {session.user.role}</p>
      <p>Wakala : {session.user.tenantName}</p>
    </div>
  );
}
```

### Mettre à jour la session (changement Wakala)

```typescript
// src/app/(dashboard)/select-wakala/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SelectWakalaPage() {
  const { update } = useSession();
  const router = useRouter();
  
  const handleSelectWakala = async (wakala: any) => {
    // Mettre à jour la session avec la nouvelle Wakala
    await update({
      tenantId: wakala.id,
      tenantName: wakala.name,
      tenantCode: wakala.code,
      role: wakala.role,
    });
    
    // Rediriger vers le dashboard
    router.push("/dashboard");
    router.refresh();
  };
  
  return (
    <div>
      {/* Liste des Wakalas */}
    </div>
  );
}
```

---

## 🔍 Debugging

### Activer les logs détaillés

Les callbacks loggent automatiquement en mode développement. Pour plus de détails :

```typescript
// src/lib/auth.ts
export const { ... } = NextAuth({
  // ...
  debug: true, // Force les logs même en production
});
```

### Logs typiques

```
✅ Connexion réussie:
[AUTH] Login attempt: { email: "user@example.com", hasTenantId: true, isReauth: false }
[AUTH] Checking tenant access: { userId: "xxx", tenantId: "yyy" }
[AUTH] Login successful with tenant: { email: "user@example.com", tenantId: "yyy" }
[JWT] Token créé pour: { userId: "xxx", email: "user@example.com", role: "ADMIN", tenantId: "yyy" }
[SIGNIN] Connexion autorisée pour: user@example.com
[REDIRECT] Redirection vers: http://localhost:3000/dashboard

❌ Connexion échouée:
[AUTH] User not found: wrong@example.com
[AUTH] Invalid password for: user@example.com
[SIGNIN] Compte désactivé: inactive@example.com
[SIGNIN] Accès tenant refusé: { userId: "xxx", tenantId: "yyy" }

🔄 Changement Wakala:
[JWT] Mise à jour tenant: { ancien: "wakala-1", nouveau: "wakala-2" }
```

---

## 🚨 Sécurité

### Bonnes pratiques

1. ✅ **Ne jamais exposer le password dans le token**
   - Le callback `jwt` ne doit JAMAIS contenir `password`

2. ✅ **Valider les données avant de les ajouter au token**
   - Vérifier que les IDs existent en base
   - Valider les permissions

3. ✅ **Utiliser signIn() pour les contrôles de sécurité**
   - Bloquer les comptes désactivés
   - Vérifier l'accès aux tenants

4. ✅ **Logs de sécurité**
   - Logger les tentatives de connexion échouées
   - Tracer les changements de Wakala

5. ✅ **Redirections sécurisées**
   - Empêcher les redirections externes malveillantes
   - Valider les URLs de redirection

---

## 📌 Résumé

| Callback | Rôle | Cas d'usage |
|----------|------|-------------|
| **jwt** | Gestion du token | Stocker données utilisateur, mise à jour tenant |
| **session** | Exposition client | Accès aux infos dans composants/pages |
| **signIn** | Contrôle d'accès | Bloquer comptes inactifs, valider accès tenant |
| **redirect** | Redirections | Personnaliser les URLs après login/logout |

---

## 🔗 Ressources

- [NextAuth.js Callbacks Documentation](https://next-auth.js.org/configuration/callbacks)
- [JWT Strategy](https://next-auth.js.org/configuration/options#jwt)
- [Session Management](https://next-auth.js.org/getting-started/client#usesession)

---

**Dernière mise à jour** : Juillet 2026
**Auteur** : Équipe Gestion Dattes
