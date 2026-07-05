# Correction Ordre des Paramètres - 05/07/2026

## Problème
```
❌ createLivraisonAction error: Error: Type de caisse introuvable: f4717c8d-9e4b-4170-95bb-ec8053ebcec7
at Object.create (src\services\livraison.service.ts:129:23)
```

## Cause Racine

Erreur d'ordre des paramètres lors de l'appel à `typeCaisseRepository.findById()`.

### Signature du repository
```typescript
// src/repositories/type-caisse.repository.ts
async findById(tenantId: string, id: string)
```

### Appels incorrects dans le service
```typescript
// src/services/livraison.service.ts - LIGNE 127 (❌ INCORRECT)
const typeCaisse = await typeCaisseRepository.findById(caisse.typeCaisseId, tenantId);
//                                                      ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^
//                                                      ID en 1er             tenantId en 2ème
//                                                      ❌ INVERSÉ!
```

Le service appelait avec `(id, tenantId)` alors que le repository attend `(tenantId, id)`.

## Solution Appliquée

Correction de l'ordre des paramètres dans **2 endroits** du fichier `livraison.service.ts`:

### 1. Méthode `create()` (ligne ~127)
```typescript
// ❌ AVANT (incorrect)
const typeCaisse = await typeCaisseRepository.findById(caisse.typeCaisseId, tenantId);

// ✅ APRÈS (correct)
const typeCaisse = await typeCaisseRepository.findById(tenantId, caisse.typeCaisseId);
```

### 2. Méthode `update()` (ligne ~183)
```typescript
// ❌ AVANT (incorrect)
const typeCaisse = await typeCaisseRepository.findById(caisse.typeCaisseId, tenantId);

// ✅ APRÈS (correct)
const typeCaisse = await typeCaisseRepository.findById(tenantId, caisse.typeCaisseId);
```

## Fichiers Modifiés

- ✅ `src/services/livraison.service.ts` (2 corrections)

## Convention Multi-Tenant

**RÈGLE GÉNÉRALE**: Dans l'architecture multi-tenant, **le `tenantId` doit TOUJOURS être le premier paramètre** des méthodes de repository.

### Pattern correct:
```typescript
// Repository methods
async findById(tenantId: string, id: string)
async findAll(tenantId: string)
async create(tenantId: string, data: any)
async update(tenantId: string, id: string, data: any)
async delete(tenantId: string, id: string)
```

### Raison:
- Le `tenantId` est le filtre de sécurité primaire
- Il doit être explicite et visible en premier
- Facilite la revue de code et la détection d'erreurs

## Test à Effectuer

1. Ouvrir `/dashboard/livraisons`
2. Cliquer sur "Nouvelle Livraison"
3. Remplir le formulaire:
   - Date: aujourd'hui
   - Agriculteur: n'importe lequel
   - Type de datte: n'importe lequel
   - Ajouter une ou plusieurs caisses avec quantités
4. Cliquer sur "Créer"
5. ✅ La livraison devrait se créer sans erreur

## Résultat Attendu

```
✅ Livraison créée avec succès
✅ Redirection vers la liste des livraisons
✅ Nouvelle livraison visible dans le tableau
```

## Notes

Cette erreur était subtile car:
- TypeScript ne détecte pas l'inversion de 2 paramètres `string`
- Le code compile sans erreur
- L'erreur n'apparaît qu'à l'exécution
- Le message d'erreur "Type de caisse introuvable" était trompeur

**Leçon**: Utiliser des types distincts pour `tenantId` et `id` (ex: branded types) pourrait prévenir ce genre d'erreur à la compilation.
