# Tests — Stock de caisses

## Tests unitaires sans base distante

Commande : `bun test tests/unit/caisse-stock.test.ts`

Ils couvrent la validation des sources Wakala/client, les répartitions de
prêt, le débit atomique, le cloisonnement des clés et le retour FIFO.

## Intégration destructive sur une branche Neon dédiée

Commande : `bun run test:integration:stock-caisses`

L'exécuteur `scripts/run-stock-caisses-integration.ts` :

1. crée une branche Neon éphémère préfixée `integration-stock-caisses-` ;
2. crée son endpoint `read_write` ;
3. récupère ses URI directe et poolée uniquement en mémoire ;
4. exécute `prisma migrate deploy`, `prisma migrate status` et le test d'intégration ;
5. supprime la branche dans un bloc `finally`, après succès ou échec.

Le test refuse de démarrer si le nom de branche, l'identifiant d'endpoint et
le jeton de garde ne sont pas injectés par cet exécuteur. Ne lancez jamais le
fichier d'intégration directement avec l'URL de la base réelle et n'utilisez
pas `prisma db push` dans ce workflow.

### Scénarios automatisés

- Réceptionner 200 puis 300 caisses client et contrôler les soldes et le ledger.
- Débiter une vente client puis une vente mixte client/Wakala.
- Créer un prêt réparti entre stock Wakala et stock client.
- Restituer exactement ses sources et refuser le double retour.
- Annuler le retour lié à une pesée avec des mouvements compensatoires.
- Refuser atomiquement l'annulation d'une réception dont le stock a été consommé.
- Refuser l'utilisation d'un client appartenant à un autre tenant.
- Exécuter deux débits concurrents et garantir que le stock ne devient jamais négatif.

Les permissions USER, AGENT, RESPONSABLE_STOCK, DIRECTION et ADMIN restent à
valider séparément dans la recette d'autorisation, car ces tests du domaine
n'émulent pas une session Auth.js.

## Recette UI

- Desktop, tablette et mobile ; français, anglais et arabe RTL.
- Thèmes clair et sombre.
- États vide, chargement, erreur réseau, succès, bouton désactivé et permission refusée.
- Filtres, recherche, pagination et retour navigateur conservés dans l'URL.
- Impression du bon de réception et de la facture de vente avec logo et section caisses.
