# Configuration de Google Auth

Le code Google OAuth est intégré, mais le bouton ne s'affiche que lorsque les deux clés Google sont configurées.

1. Ouvrir **Google Cloud Console → APIs et services → Écran de consentement OAuth** et configurer l'application.
2. Dans **Identifiants**, créer un **ID client OAuth 2.0** de type **Application Web**.
3. Ajouter les origines JavaScript autorisées :
   - `http://localhost:3000`
   - `https://gestion-dattes.vercel.app`
4. Ajouter les URI de redirection autorisés :
   - `http://localhost:3000/api/auth/callback/google`
   - `https://gestion-dattes.vercel.app/api/auth/callback/google`
5. Copier `.env.example` vers `.env.local`, puis remplacer les valeurs de :

```env
AUTH_SECRET="une-valeur-longue-et-aleatoire"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="...apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="..."
AUTH_GOOGLE_ALLOW_SIGNUP="true"
```

Pour Vercel, définir les mêmes variables dans **Project Settings → Environment Variables**. Ne jamais publier `AUTH_GOOGLE_SECRET`.

`AUTH_GOOGLE_ALLOW_SIGNUP=true` autorise la création d'un compte local après vérification de l'e-mail par Google. Avec `false`, seuls les e-mails déjà présents dans la table `User` sont acceptés.
