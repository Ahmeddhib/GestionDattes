# Rapport technique et fonctionnel — KAYEN, application de gestion de dattes

> **Destination de ce document.** Il est rédigé pour servir de source unique à la
> production d'un rapport de stage au format Word. Chaque affirmation est tirée du
> code du dépôt (schéma Prisma, services, composants) et non d'une description
> générique. Les diagrammes UML correspondants se trouvent dans `docs/uml/`
> (fichiers PlantUML).

---

## 1. Présentation générale

### 1.1 Contexte métier

KAYEN est une **wakala** (agence de conditionnement et de commercialisation de
dattes). Son activité suit un cycle annuel — la **campagne**, appelée *saison*
dans l'application — qui s'articule autour de quatre flux :

1. **Réception** — les agriculteurs livrent leur récolte en caisses. Chaque
   livraison est pesée caisse par caisse afin d'établir un poids **net**
   (poids brut moins la tare des caisses).
2. **Achat** — la pesée valorise la livraison et génère un **bon d'achat**, qui
   matérialise la dette de la wakala envers l'agriculteur. Cette dette est ensuite
   soldée par des **paiements** successifs.
3. **Stock et vente** — la marchandise acceptée entre en stock par lot, puis est
   vendue à des clients. Chaque vente crée une **créance**, soldée par des
   **encaissements**.
4. **Clôture** — en fin de campagne, un bilan figé arrête les comptes de la saison.

À cela s'ajoute la gestion des **caisses consignées** : la wakala prête des caisses
vides aux agriculteurs et doit savoir combien sont dehors à tout instant.

### 1.2 Problème traité

Avant informatisation, ces flux étaient suivis sur papier et tableur, avec trois
conséquences :

- **Aucun lien automatique entre la pesée et l'achat.** Le prix appliqué et le
  poids net étaient recopiés à la main, source d'écarts entre le bon remis à
  l'agriculteur et la comptabilité interne.
- **Solde des tiers inconnu à l'instant t.** Savoir combien restait dû à un
  agriculteur, ou combien un client restait devoir, exigeait de reparcourir tout
  l'historique.
- **Pas de séparation entre campagnes.** Le stock invendu d'une année se mélangeait
  au nouveau, rendant impossible tout calcul de marge par campagne.

### 1.3 Objectifs de l'application

| Objectif | Traduction dans l'application |
|---|---|
| Fiabiliser la pesée | Saisie caisse par caisse, poids net calculé, jamais saisi |
| Automatiser l'achat | Bon d'achat généré par la pesée, relation 1..1 avec la livraison |
| Suivre les tiers | Statuts `EN_ATTENTE` / `PARTIEL` / `PAYE` dérivés des règlements |
| Cloisonner les campagnes | Entité `Saison`, une seule ouverte à la fois, clôture irréversible |
| Tracer les décisions | Journal d'audit de 61 types d'actions |
| Servir plusieurs agences | Architecture multi-tenant sur `tenantId` |

---

## 2. Environnement technique

### 2.1 Pile logicielle

| Couche | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router, Server Components, Server Actions) | 16.3.1 |
| Bibliothèque UI | React | 19.2.4 |
| Langage | TypeScript | 5.x |
| ORM | Prisma | 7.8 |
| Base de données | PostgreSQL hébergée sur Neon (adaptateur `@prisma/adapter-neon`, WebSocket) | — |
| Authentification | NextAuth (Auth.js) | 5.0 beta |
| Validation | Zod | 4.x |
| Formulaires | React Hook Form + `@hookform/resolvers` | 7.x |
| Tableaux | TanStack Table | 8.21 |
| Composants | Radix UI + shadcn/ui | — |
| Style | Tailwind CSS | 4.x |
| Graphiques | Recharts | 3.8 |
| Internationalisation | next-intl (français, anglais, arabe) | 4.13 |
| Exports | jsPDF + jspdf-autotable, SheetJS (xlsx) | — |
| Thème | next-themes (clair / sombre) | — |

### 2.2 Volumétrie du code

| Élément | Quantité |
|---|---|
| Modèles de données Prisma | 28 |
| Énumérations | 6 |
| Migrations de base | 21 |
| Server Actions | 89 |
| Services métier | 25 |
| Repositories | 23 |
| Schémas de validation Zod | 19 |
| Langues de l'interface | 3 (fr, en, ar) |

---

## 3. Architecture logicielle

### 3.1 Découpage en couches

L'application applique une séparation stricte en quatre couches, du navigateur
vers la base :

```
Composant client (React)
        │  appel de fonction, pas de fetch HTTP
        ▼
Server Action  (src/actions/)      ← frontière réseau, validation Zod, session
        │
        ▼
Service        (src/services/)     ← règles métier, permissions, transactions
        │
        ▼
Repository     (src/repositories/) ← construction des requêtes Prisma
        │
        ▼
Prisma / PostgreSQL
```

**Ce que chaque couche a le droit de faire — et surtout ce qu'elle n'a pas le
droit de faire :**

- Une **Server Action** résout la session, détermine la wakala courante, valide
  les entrées avec Zod, puis délègue. Elle ne contient aucune règle métier et
  n'interroge jamais Prisma directement.
- Un **service** vérifie la permission (`requirePermission`), applique les règles
  du domaine, ouvre les transactions et journalise l'audit. C'est la seule couche
  autorisée à composer plusieurs repositories.
- Un **repository** ne connaît ni permission ni session : il reçoit un `tenantId`
  déjà résolu et construit la requête. Il ne décide de rien.

Cette discipline a une conséquence pratique : une règle métier ne peut pas être
contournée en appelant une autre entrée, puisque toutes les entrées passent par
le service.

### 3.2 Architecture multi-tenant

Chaque table métier porte une colonne `tenantId` et une relation vers `Tenant`
avec `onDelete: Cascade`. Un utilisateur peut appartenir à plusieurs wakalas avec
un rôle **différent dans chacune** : c'est le rôle de la classe-association
`TenantUser`, contrainte par une unicité `(userId, tenantId)`.

Toute requête filtre sur `tenantId`. Les recherches par identifiant utilisent
systématiquement `findFirst({ where: { id, tenantId } })` et non `findUnique({ id })` :
sans cela, connaître l'identifiant d'un enregistrement d'une autre wakala suffirait
à le lire.

### 3.3 Sécurité

**Authentification.** NextAuth avec stratégie *credentials*, mots de passe hachés
en bcrypt. Un proxy (`src/proxy.ts`) protège les routes du tableau de bord.

**Autorisation.** Une matrice explicite (`src/constants/permissions.ts`) associe
chaque permission à la liste des rôles qui la détiennent. Cinq rôles existent :

| Rôle | Vocation |
|---|---|
| `ADMIN` | Administration complète, seul habilité à clôturer une saison |
| `AGENT` | Saisie opérationnelle : livraisons, pesées, ventes, encaissements |
| `RESPONSABLE_STOCK` | Stock, caisses, bons d'achat |
| `LABORANTIN` | Échantillons et analyses qualité |
| `DIRECTION` | Consultation, bilans, dépenses |

La vérification est faite **côté serveur** dans le service, jamais seulement en
masquant un bouton dans l'interface.

**Traçabilité.** Toute opération significative écrit un `AuditLog` portant
l'acteur, l'action (parmi 61 valeurs énumérées), la cible et un détail JSON.
Lorsque l'opération est transactionnelle, le journal est écrit **dans la même
transaction** : une opération réussie ne peut pas être non journalisée.

---

## 4. Modèle de données

Le diagramme de classes complet est fourni dans
`docs/uml/01-diagramme-classes.puml`. Cette section commente les choix
structurants.

### 4.1 Les huit domaines

| Domaine | Entités |
|---|---|
| Sécurité et multi-tenant | `Tenant`, `User`, `Role`, `TenantUser`, `AuditLog` |
| Référentiels | `Region`, `Agriculteur`, `Client`, `Livreur`, `TypeDate`, `TypeCaisse` |
| Campagne | `Saison`, `BilanSaison` |
| Réception | `Livraison`, `LivraisonTypeCaisse`, `Pesee`, `PeseeCaisse` |
| Qualité | `Echantillon`, `Analyse` |
| Caisses | `PretCaisse` |
| Achat | `BonAchat`, `PaiementAgriculteur` |
| Stock et vente | `StockDate`, `Conditionnement`, `BonSortie`, `Vente`, `EncaissementClient` |
| Charges | `DepenseAutre` |

### 4.2 Trois décisions de modélisation à expliquer

**(a) La pesée est décomposée à deux niveaux.**
`Pesee` porte une ligne par couple *(type de datte, type de caisse)* — contrainte
d'unicité `(livraisonId, typeCaisseId, typeDateId)` — et `PeseeCaisse` enregistre
le poids brut de **chaque caisse individuelle**. Le poids net n'est jamais saisi :
il se déduit par `poidsNet = poidsBrut − (nombreCaisses × tare)`. Les poids sont
stockés en `Decimal(8,2)` et non en `Float`, afin qu'un total de plusieurs
centaines de pesées ne dérive pas par accumulation d'erreurs binaires.

**(b) Le bon d'achat est en relation 1..1 avec la livraison.**
Le champ `BonAchat.livraisonId` est déclaré `@unique`. Ce n'est pas une commodité :
c'est la garantie qu'une même livraison ne peut jamais être payée deux fois. La
contrainte est portée par la base, donc elle tient même si un défaut applicatif
tentait la double création.

**(c) Le stock distingue la saison d'*origine* de la saison de *transaction*.**
C'est le point le plus subtil du modèle.

- `StockDate.saisonOrigineId` = la saison pendant laquelle le lot est **entré**.
  Elle est héritée de la livraison et **jamais réécrite**.
- `Vente.saisonId` = la saison pendant laquelle la **transaction** a lieu.

Vendre en saison B un lot entré en saison A est une situation normale — c'est du
stock reporté. Confondre les deux champs produirait des bilans faux : soit le
chiffre d'affaires serait attribué à la mauvaise campagne, soit le stock reporté
disparaîtrait des écrans et deviendrait invendable. L'interface de vente affiche
donc, sur chaque lot, sa saison d'origine, et signale visuellement (badge ambre,
mention « report ») les lots venus d'une campagne antérieure.

### 4.3 Contraintes déportées en SQL

Deux règles ne sont pas exprimables dans le langage de schéma de Prisma et ont été
posées en SQL brut par migration, sous forme d'**index uniques partiels** :

| Index | Effet |
|---|---|
| `Saison_one_open_per_tenant` sur `(tenantId) WHERE statut = 'OUVERTE'` | Une wakala n'a jamais deux saisons ouvertes simultanément |
| `BilanSaison_one_final_per_saison` sur `(saisonId) WHERE type = 'FINAL'` | Une saison n'a jamais deux bilans de clôture |

Les placer dans la base plutôt que dans le code applicatif signifie qu'elles
résistent aux accès concurrents : deux requêtes simultanées ne peuvent pas
toutes deux passer le contrôle avant d'écrire.

---

## 5. Modules fonctionnels

### 5.1 Référentiels

Régions, agriculteurs, clients, livreurs, types de dattes et types de caisses.
Chaque agriculteur porte un code et un CIN uniques **par wakala** (`@@unique([tenantId, cin])`),
sa région, et des données d'exploitation (nombre de palmiers, superficie,
production estimée) qui servent aux statistiques.

### 5.2 Livraisons et pesées

La livraison déclare ce que l'agriculteur apporte : un numéro de lot unique par
wakala, une date, une quantité déclarée, et une répartition par type de caisse et
type de datte (`LivraisonTypeCaisse`).

La pesée établit ensuite le poids réel. L'écran de pesée est un assistant : on
choisit le couple type de datte / type de caisse, on saisit la tare et le prix au
kilo, puis on pèse les caisses une à une. À la validation, l'application, **dans
une seule transaction** :

1. crée les lignes `Pesee` et `PeseeCaisse` ;
2. met à jour `Livraison.quantiteAcceptee` ;
3. génère le **bon d'achat** valorisé au prix saisi ;
4. crée ou complète les lots de `StockDate` correspondants ;
5. déclenche le **retour automatique des caisses** prêtées, en enregistrant le
   nombre effectivement rendu dans `Pesee.caissesRetournees`.

Ce dernier champ mérite une explication : sans lui, supprimer une livraison ne
permettait pas d'annuler exactement le retour de caisses. On retombait alors sur
le nombre de caisses pesées, qui surestime le retour dès qu'aucun prêt n'était
ouvert — et le stock de caisses devenait faux.

### 5.3 Caisses consignées

`PretCaisse` suit le nombre de caisses prêtées et rendues, avec trois statuts :
`EN_COURS`, `RETOURNE`, `INCOMPLET`. Un prêt peut être rattaché à une livraison
et à un livreur, mais les deux sont optionnels : un prêt autonome (avant toute
livraison) doit rester possible. C'est pourquoi `PretCaisse.saisonId` est
obligatoire — sans lui, un prêt autonome n'aurait aucun rattachement de campagne.

### 5.4 Achats et paiements agriculteurs

Le bon d'achat porte le prix au kilo, le montant et un statut. Le montant déjà
payé n'est **pas** stocké : il est recalculé comme la somme des
`PaiementAgriculteur` rattachés. Ce choix évite toute désynchronisation entre un
total mémorisé et ses composants.

Le module offre l'impression du bon d'achat en PDF, avec la charte de l'agence.

### 5.5 Stock de dattes et ventes

Le stock est présenté agrégé par type de datte, avec le détail des lots
consultable dans une fenêtre dédiée. L'agrégation est faite **en base**
(`prisma.groupBy`) et non en mémoire, afin que la page reste rapide quel que soit
le nombre de lots.

La vente sélectionne un lot, une quantité et un prix. Le service refuse la vente
si la quantité demandée dépasse `quantiteDisponible`, puis crée la vente et
décrémente le lot dans la même transaction. Chaque vente peut être imprimée en
facture PDF et soldée par des encaissements successifs.

### 5.6 Finance

- **Autres dépenses** : charges hors paiements agriculteurs, catégorisées.
- **Bilan financier** : vue consolidée des flux de la wakala.
- **Exports** : chaque liste s'exporte en PDF et en Excel, en respectant les
  filtres actifs à l'écran.

### 5.7 Saisons

C'est le module qui donne sa cohérence à l'ensemble.

- **Création** : une saison créée est toujours `OUVERTE`. L'interface ne propose
  pas de créer une saison déjà close — ce serait une campagne morte à la
  naissance, dans laquelle aucune opération ne pourrait être saisie.
- **Garde d'écriture** : `assertSaisonOuverte` protège toute opération d'écriture.
  Entre deux campagnes, aucune saison n'étant ouverte, l'application refuse
  proprement toute nouvelle saisie.
- **Bilan provisoire** : un instantané des indicateurs, générable autant de fois
  que voulu pendant la campagne. Il ne modifie **jamais** le statut de la saison.
- **Clôture** : opération irréversible détaillée en section 6.2.

Les bilans sont **versionnés** par une séquence monotone partagée entre les
provisoires et le final (v1, v2 provisoires, puis vN final). Un instantané, une
fois créé, n'est jamais recalculé ni réécrit, même si les données sous-jacentes
changent ensuite : c'est ce qui en fait une pièce d'archive.

---

## 6. Scénarios détaillés

### 6.1 Cas d'utilisation « Enregistrer une vente »

*Diagrammes : `docs/uml/03-cas-utilisation-detaille-vente.puml` et
`docs/uml/05-sequence-enregistrer-vente.puml`.*

| Rubrique | Contenu |
|---|---|
| **Acteurs** | Agent de saisie, Administrateur (acteur secondaire : le client, destinataire de la facture) |
| **Objectif** | Enregistrer la vente d'une quantité de dattes issue d'un lot de stock, à un client, et diminuer le stock en conséquence |
| **Préconditions** | L'utilisateur est authentifié, rattaché à une wakala, détient `vente:create` ; une saison est `OUVERTE` ; au moins un lot a `quantiteDisponible > 0` |
| **Postconditions** | Une `Vente` existe au statut `EN_ATTENTE` ; `StockDate.quantiteDisponible` a diminué d'autant ; un `AuditLog` `CREATE_VENTE` a été écrit |

**Scénario nominal**

1. L'agent ouvre le formulaire « Nouvelle Vente ».
2. Le système charge les clients de la wakala et les lots disponibles. Chaque lot
   est présenté avec son type de datte, son numéro, sa **saison d'origine** et sa
   quantité restante.
3. L'agent choisit un client.
4. L'agent choisit un lot. Un lot issu d'une campagne antérieure est signalé par
   un badge ambre portant la mention « report ».
5. L'agent saisit la quantité et le prix unitaire ; le montant total s'affiche.
6. L'agent valide.
7. Le système vérifie la permission, l'existence du client et du lot dans cette
   wakala, puis que la quantité demandée est disponible.
8. Le système détermine la saison ouverte.
9. Dans une transaction : la vente est créée, puis le lot est décrémenté.
10. L'opération est journalisée, la liste rafraîchie, une confirmation affichée.

**Scénarios alternatifs et d'erreur**

| Cas | Comportement |
|---|---|
| Permission absente | Refus, message d'autorisation |
| Client ou lot d'une autre wakala | Refus : « introuvable dans cette Wakala » |
| Quantité > stock disponible | Refus : « Stock insuffisant. Disponible : X, Demandé : Y » |
| Aucune saison ouverte | Refus par la garde de saison |
| Base injoignable | Message dédié, frontière d'erreur préservant la navigation |

**Règles de gestion**

- **RG-V1** — Le sélecteur de lots liste **tous** les lots disponibles, toutes
  saisons confondues. Le filtrer par saison masquerait le stock reporté et
  empêcherait de l'écouler.
- **RG-V2** — `Vente.saisonId` reçoit la saison **ouverte**, jamais la saison
  d'origine du lot.
- **RG-V3** — Une vente n'est corrigeable (client, quantité, prix) que tant
  qu'aucun encaissement n'y est rattaché. Le lot et la saison ne sont jamais
  modifiables.
- **RG-V4** — Le statut (`EN_ATTENTE` / `PARTIEL` / `PAYE`) découle du rapport
  entre montant encaissé et montant total ; il n'est pas saisi.

### 6.2 Cas d'utilisation « Clôturer une saison »

*Diagrammes : `docs/uml/04-cas-utilisation-detaille-cloture.puml` et
`docs/uml/06-sequence-cloturer-saison.puml`.*

| Rubrique | Contenu |
|---|---|
| **Acteur** | Administrateur exclusivement (`saison:cloturer`) |
| **Objectif** | Arrêter définitivement les comptes d'une campagne et en figer le bilan |
| **Préconditions** | La saison visée est `OUVERTE` ; aucun point bloquant ne subsiste |
| **Postconditions** | Un `BilanSaison` de type `FINAL` existe ; la saison est `CLOTUREE`, horodatée et attribuée ; un `AuditLog` `CLOTURER_SAISON` a été écrit |

**Scénario nominal**

1. L'administrateur ouvre l'écran de clôture de la saison.
2. Le système calcule les indicateurs de la campagne et, en parallèle, la
   checklist : points **bloquants** et **avertissements**.
3. L'écran présente la checklist et les indicateurs. Chaque point renvoie par un
   lien profond vers la liste concernée, pré-filtrée sur la saison.
4. Tant qu'un point bloquant subsiste, l'action de clôture reste indisponible.
5. L'administrateur confirme.
6. Dans une transaction : les points bloquants sont **revalidés**, les indicateurs
   recalculés, le bilan `FINAL` créé, la saison passée en `CLOTUREE`, l'audit écrit.
7. Le système signale qu'aucune saison n'est désormais ouverte et invite à créer
   la suivante.

**Les deux points bloquants, et leur justification**

| Point | Pourquoi il bloque |
|---|---|
| Livraison sans aucune pesée | Le poids net n'a jamais été établi : les quantités restent déclaratives et tous les indicateurs en aval sont faux |
| Livraison sans bon d'achat | L'achat n'a jamais été valorisé : la dette envers l'agriculteur n'existe pas et la marge brute est surévaluée |

Il faut noter que ces conditions sont définies **structurellement** et non par un
statut. Le schéma n'a aucune notion de brouillon : `Livraison` ne porte pas de
champ statut, et `StatutVente` / `StatutBonAchat` décrivent un état de *paiement*,
pas de complétude.

**Les avertissements, non bloquants**

Dettes agriculteurs restantes, créances clients restantes, caisses non retournées,
stock restant, paiements et encaissements partiels, bons d'achat impayés. Aucun
n'empêche la clôture : ce sont des situations normales de fin de campagne, et
c'est au propriétaire de décider que celle-ci est terminée.

**Points d'attention techniques**

- **La revalidation a lieu dans la transaction.** L'aperçu affiché à l'écran peut
  dater de plusieurs minutes ; un contrôle effectué hors transaction laisserait
  une fenêtre pendant laquelle une livraison incomplète pourrait être créée.
- **La saison suivante n'est pas créée automatiquement.** C'est un acte de gestion
  qui revient à un administrateur. Entre les deux, l'application bloque proprement
  toute écriture.
- **La clôture est irréversible.** Une saison clôturée n'est jamais rouverte, et
  ses documents deviennent en lecture seule.

---

## 7. Interface utilisateur

### 7.1 Principes

- **Tableau de bord** avec indicateurs, graphiques (Recharts) et alertes
  opérationnelles (livraisons sans pesée, sans bon d'achat, stock sous seuil).
- **Navigation latérale** organisée en trois blocs : vue d'ensemble, gestion,
  finance.
- **Sélecteur de saison** présent en tête des écrans concernés, permettant de
  consulter la campagne courante, une campagne passée, ou toutes.

### 7.2 Tableaux : pagination côté serveur

Les listes ne chargent jamais l'intégralité des données. La pagination, le tri, la
recherche et le filtrage sont effectués **par la base**, et l'état vit dans l'URL
(ce qui rend une vue filtrée partageable et navigable avec les boutons du
navigateur).

Deux règles de conception en découlent :

- Les clés de tri forment une **table fermée** : une clé absente de cette table
  n'est pas cliquable et serait refusée par le serveur. Aucun texte venu de l'URL
  n'est transmis à Prisma.
- Les **statistiques d'en-tête portent sur le jeu filtré entier**, pas sur la page
  affichée. Un total qui changerait en passant de la page 1 à la page 2 serait un
  défaut ; c'est le critère de recette systématiquement vérifié sur chaque module.

Un cas mérite d'être signalé : le montant encaissé d'une liste de ventes ne peut
pas se sommer depuis les ventes, puisqu'il vit dans une autre table. Il est donc
agrégé sur `EncaissementClient` en lui appliquant **le même filtre**, par relation.
Sans cette précaution, le chiffre d'affaires porterait sur le filtre et l'encaissé
sur la totalité des ventes.

### 7.3 Alignement des colonnes

Les colonnes portent leur alignement dans leur métadonnée
(`meta: { align: "right" | "center" }`), consommée à la fois par l'en-tête et par
les cellules. Auparavant, l'alignement était décidé à deux endroits distincts :
la cellule portait `text-right`, tandis que l'en-tête restait à gauche par défaut.
Le libellé et sa valeur se retrouvaient aux deux extrémités de la colonne, d'autant
plus que les montants sont larges et les libellés courts.

### 7.4 Thème et internationalisation

- Thème clair et sombre, via des jetons de couleur (`--foreground`, `--card`,
  `--muted-foreground`…) plutôt que des couleurs codées en dur.
- Trois langues : français, anglais, arabe, y compris pour les messages de
  validation Zod.

### 7.5 Exports et documents

| Document | Format |
|---|---|
| Bon d'achat | PDF avec charte de l'agence |
| Facture de vente | PDF, numérotée `KFP/AAAA/XXXXXX`, avec timbre fiscal |
| Bilan de saison | PDF et Excel |
| Toute liste filtrée | PDF et Excel |

---

## 8. Qualité et validation

### 8.1 Portes de validation

Chaque évolution passe par : compilation TypeScript stricte (`tsc --noEmit`),
analyse statique ESLint, et construction de production (`next build`).

### 8.2 Recette fonctionnelle automatisée

Une recette pilotée par navigateur (Playwright) parcourt les sept modules de
liste et vérifie, pour chacun : la pagination, le tri, la recherche, les filtres
et — surtout — l'invariant énoncé en 7.2, à savoir l'identité des statistiques
d'en-tête entre les pages.

Les scénarios attendent une **condition déterministe** (« la plage `x–y sur n` est
affichée ») et non un délai fixe : un délai arbitraire produit des échecs
intermittents qui ressemblent à des défauts applicatifs alors que l'application
est correcte.

### 8.3 Vérification de l'adaptation aux écrans

Le formulaire de vente a été mesuré sur cinq résolutions (360, 390, 667 en
paysage, 768, 1440 px) en contrôlant : absence de défilement horizontal, dialogue
contenu dans la fenêtre avec marge, liste déroulante alignée sur son champ,
absence de débordement des lignes, et fonctionnement de la molette.

### 8.4 Limites connues

Ces points sont documentés plutôt que passés sous silence :

- Les onglets de détail d'une saison chargent encore l'intégralité de leurs
  données côté client.
- Les exports et la facture PDF ne mentionnent pas la saison d'origine du lot.
- Trois formulaires de vente conservent des types `any` hérités, liés à une
  friction connue entre Zod et React Hook Form sur les champs numériques vides.
- L'hébergement de la base en `us-east-1` impose une latence d'environ 150 ms par
  aller-retour depuis la Tunisie ; l'application compense par des agrégations en
  base et des requêtes parallélisées, mais une région plus proche serait
  préférable en production.

---

## 9. Bilan

### 9.1 Résultats

L'application couvre l'intégralité du cycle métier, de la réception de la récolte
à la clôture comptable de la campagne, pour plusieurs agences cloisonnées, avec
gestion fine des rôles et journalisation complète.

Les garanties les plus fortes ne reposent pas sur du code applicatif mais sur la
base elle-même : unicité du bon d'achat par livraison, unicité de la saison
ouverte, unicité du bilan final. Elles résistent donc aux accès concurrents et à
un éventuel défaut du code.

### 9.2 Compétences mobilisées

- Conception d'un modèle relationnel avec contraintes d'intégrité déportées en SQL
- Architecture applicative en couches à responsabilités séparées
- Rendu serveur, Server Actions et pagination côté base
- Sécurité applicative : authentification, matrice d'autorisations, cloisonnement
  multi-tenant, audit
- Transactions et cohérence de données
- Accessibilité, thème sombre, internationalisation (dont une langue de droite à
  gauche)
- Tests d'interface automatisés et démarche de recette

### 9.3 Perspectives

- Pagination côté serveur des onglets de détail de saison
- Ajout de la saison d'origine dans les exports
- Tableau de bord comparatif entre campagnes, à partir des bilans figés
- Application mobile pour la saisie de pesée sur le quai de réception

---

## Annexe A — Index des diagrammes UML

| Fichier source | Contenu | Format rendu |
|---|---|---|
| `01-diagramme-classes.puml` | Diagramme de classes complet (28 entités, 8 domaines) | 4823 × 2006 — **page paysage** |
| `07-diagramme-classes-noyau.puml` | Vue simplifiée : les 12 entités du flux récolte → vente | 1180 × 925 — page portrait |
| `02-cas-utilisation-global.puml` | Cas d'utilisation global, 5 acteurs | 1082 × 3042 — page portrait |
| `03-cas-utilisation-detaille-vente.puml` | Cas d'utilisation détaillé — Enregistrer une vente | 1026 × 1254 |
| `04-cas-utilisation-detaille-cloture.puml` | Cas d'utilisation détaillé — Clôturer une saison | 1012 × 1046 |
| `05-sequence-enregistrer-vente.puml` | Séquence — Enregistrer une vente | 2005 × 2146 |
| `06-sequence-cloturer-saison.puml` | Séquence — Clôturer une saison | 2083 × 2335 |

**Les images sont déjà générées** dans `docs/uml/png/` (insertion directe dans
Word) et `docs/uml/svg/` (vectoriel, à préférer pour l'impression et le zoom).

Conseil de mise en page : insérer le **diagramme noyau** dans le corps du rapport
et renvoyer le diagramme complet en annexe sur une page en orientation paysage.

**Régénération** après modification d'un `.puml` :

```bash
java -DPLANTUML_LIMIT_SIZE=20000 -jar plantuml.jar -charset UTF-8 -tpng -o png docs/uml/*.puml
java -DPLANTUML_LIMIT_SIZE=20000 -jar plantuml.jar -charset UTF-8 -tsvg -o svg docs/uml/*.puml
```

L'option `-DPLANTUML_LIMIT_SIZE` est indispensable : la limite par défaut de
4096 px **tronque silencieusement** le diagramme de classes complet, sans message
d'erreur ni code de retour non nul. Le diagramme paraît correct mais son bord
droit est amputé.

Les fichiers peuvent aussi être collés sur <https://www.plantuml.com/plantuml>.

## Annexe B — Matrice des rôles et permissions

| Domaine | Lecture | Création / modification | Suppression |
|---|---|---|---|
| Utilisateurs, rôles | ADMIN, DIRECTION | ADMIN | ADMIN |
| Régions, types | tous les rôles opérationnels | ADMIN (types : + RESPONSABLE_STOCK) | ADMIN |
| Agriculteurs, clients, livreurs | ADMIN, AGENT, RESP. STOCK, DIRECTION | ADMIN, AGENT | ADMIN |
| Livraisons | + LABORANTIN | ADMIN, AGENT, RESP. STOCK | ADMIN |
| Pesées | ADMIN, AGENT, RESP. STOCK, DIRECTION | ADMIN, AGENT | ADMIN |
| Prêts de caisses | ADMIN, AGENT, RESP. STOCK, DIRECTION | ADMIN, AGENT, RESP. STOCK | — |
| Bons d'achat | ADMIN, AGENT, RESP. STOCK, DIRECTION | ADMIN, AGENT, RESP. STOCK | — |
| Paiements agriculteurs | ADMIN, AGENT, RESP. STOCK, DIRECTION | ADMIN, AGENT, RESP. STOCK | — |
| Ventes | ADMIN, AGENT, RESP. STOCK, DIRECTION | ADMIN, AGENT | — |
| Encaissements clients | ADMIN, AGENT, RESP. STOCK, DIRECTION | ADMIN, AGENT | — |
| Dépenses, bilan financier | ADMIN, DIRECTION | ADMIN, DIRECTION | ADMIN |
| Saisons | ADMIN, AGENT, RESP. STOCK, DIRECTION | ADMIN, DIRECTION | jamais supprimée |
| Clôture de saison | — | **ADMIN uniquement** | — |
| Bilan provisoire | — | ADMIN, DIRECTION | — |
| Journal d'audit | ADMIN, DIRECTION | — | — |
