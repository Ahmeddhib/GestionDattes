# Phase 2 — Design du stock de caisses

## Source de vérité

Le stock physique d'un type de caisse est dérivé de ses comptes propriétaires :

```text
Stock physique = StockCaisseWakala.quantite + SUM(StockCaisseClient.quantite)
```

`TypeCaisse.stockDisponible` est conservé temporairement pour compatibilité avec les anciennes données et interfaces. Les nouvelles opérations métier utilisent les tables propriétaires et créent systématiquement un `MouvementCaisse`.

## ERD réel

```text
Tenant 1 ── N TypeCaisse
Tenant 1 ── N StockCaisseWakala N ── 1 TypeCaisse
Tenant 1 ── N StockCaisseClient N ── 1 Client
                                  N ── 1 TypeCaisse

Client 1 ── N ReceptionCaisses 1 ── N ReceptionCaissesLigne N ── 1 TypeCaisse

Tenant 1 ── N MouvementCaisse N ── 1 TypeCaisse
Client 0..1 ── N MouvementCaisse
ReceptionCaisses / Vente / PretCaisse / Pesee 0..1 ── N MouvementCaisse

Vente 1 ── N VenteCaisse N ── 1 TypeCaisse
Client propriétaire 0..1 ── N VenteCaisse

PretCaisse 1 ── N PretCaisseSource N ── 1 TypeCaisse
Client propriétaire 0..1 ── N PretCaisseSource
```

## Tables conservées

- `Tenant` reste la Wakala et la frontière d'isolation.
- `TypeCaisse` conserve son identifiant et `poidsKg` conserve strictement le sens de tare.
- `PretCaisse`, `Pesee`, `Livraison`, `Vente`, `StockDate`, `Saison` et `AuditLog` restent en place.
- Le workflow Agriculteur → Livraison → Pesée → StockDate → BonAchat n'est pas remplacé.

## Tables ajoutées

- `StockCaisseWakala` : un solde par `(tenantId, typeCaisseId)`.
- `StockCaisseClient` : un solde par `(tenantId, clientId, typeCaisseId)`.
- `ReceptionCaisses` et `ReceptionCaissesLigne` : document d'entrée multi-camion et multi-type.
- `MouvementCaisse` : ledger immuable fonctionnellement, quantité toujours positive et direction explicite.
- `VenteCaisse` : sources multiples d'une vente.
- `PretCaisseSource` : provenance exacte des caisses d'un prêt et compteur de retour par source.

## Contraintes et concurrence

- Les deux tables de solde possèdent une contrainte SQL `quantite >= 0`.
- Les lignes de document et mouvements imposent `quantite > 0`.
- Une source `CLIENT` exige `clientProprietaireId`; une source `WAKALA` l'interdit.
- Chaque débit utilise un `updateMany` filtré par `tenantId`, propriétaire, type et `quantite >= débit`, puis vérifie `count === 1`.
- Les retours de prêts utilisent une mise à jour optimiste sur l'ancien `nombreRetourne`.
- Les retours automatiques de pesée sont distribués en FIFO et chaque mouvement porte `peseeId`.
- Une suppression de pesée/livraison produit un mouvement compensatoire ; le ledger historique n'est pas supprimé.

## Migration des données

Migration additive `20260907120000_stock_caisses_propriete_ledger` :

```text
ancien TypeCaisse.stockDisponible
  → StockCaisseWakala(tenantId, typeCaisseId, quantite)

ancien PretCaisse(nombrePrete, nombreRetourne)
  → PretCaisseSource(proprietaire=WAKALA, mêmes quantités)
```

Aucune propriété client historique n'est inventée. La migration corrective `20260909100000_pesee_return_compensation` ajoute le type de compensation et transforme la FK de pesée en `ON DELETE SET NULL`, sans modifier la migration déjà déployée.

## Transactions métier

- Réception : document + lignes + crédits client + mouvements + audit.
- Annulation réception : statut + débits compensatoires + mouvements + audit.
- Vente : vente + débit StockDate + lignes VenteCaisse + débits propriétaires + mouvements + audit.
- Prêt : prêt + sources + débits propriétaires + mouvements + audit.
- Retour : compteur du prêt + compteurs des sources + crédits propriétaires + mouvements + audit.
- Ajustement : fiche TypeCaisse + solde Wakala + mouvement + audit.

Toutes ces séquences sont atomiques et filtrées par le tenant issu de la session.
