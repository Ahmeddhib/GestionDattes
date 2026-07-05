# Résolution Problème Prisma Client - 05/07/2026

## Problème
```
Unknown field `LivraisonTypeCaisse` for include statement on model `Livraison`
```

## Cause Racine
Après avoir ajouté le modèle `LivraisonTypeCaisse` au schéma Prisma, le client Prisma n'a pas été régénéré, donc TypeScript et l'exécution ne reconnaissaient pas le nouveau modèle.

## Solution Appliquée

### 1. Régénération du client Prisma
```bash
bunx prisma generate
```

### 2. Arrêt du serveur dev
Le serveur dev verrouillait des fichiers dans `.next/`, empêchant la suppression du cache.

### 3. Suppression du cache Next.js
```bash
Remove-Item -Recurse -Force .next
```

### 4. Redémarrage du serveur dev
```bash
bun run dev
```

## Résultat
✅ Serveur démarré avec succès
✅ Page `/dashboard/livraisons` compilée avec HTTP 200
✅ Le modèle `LivraisonTypeCaisse` est maintenant reconnu

## Procédure à Suivre TOUJOURS après Modification du Schema

1. **Modifier** `prisma/schema.prisma`
2. **Appliquer la migration** (si nécessaire)
   ```bash
   bunx prisma migrate dev --name nom_migration
   ```
3. **Régénérer le client Prisma**
   ```bash
   bunx prisma generate
   ```
4. **Arrêter le serveur dev**
5. **Supprimer le cache Next.js**
   ```bash
   Remove-Item -Recurse -Force .next
   ```
6. **Redémarrer le serveur dev**
   ```bash
   bun run dev
   ```

## Note Importante
Cette séquence est **OBLIGATOIRE** après toute modification du schéma Prisma pour éviter les erreurs de type "Unknown field" ou "Unknown model".
