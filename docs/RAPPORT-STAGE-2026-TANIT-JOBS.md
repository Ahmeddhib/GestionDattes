# Remerciements

Je tiens à exprimer ma profonde gratitude à l’ensemble de l’équipe de Tanit Jobs pour son accueil, sa disponibilité et la confiance qui m’a été accordée durant ce stage. Cette immersion m’a permis de découvrir les exigences d’un projet numérique mené dans un contexte professionnel et de consolider mes connaissances par la réalisation d’une application complète.

Je remercie tout particulièrement mon encadrant professionnel, [Nom de l’encadrant chez Tanit Jobs], pour ses conseils, ses retours et son accompagnement pendant les différentes étapes du projet, depuis l’analyse du besoin jusqu’aux validations fonctionnelles. Je remercie également mon encadrant académique, [Nom de l’encadrant ESPRIT], pour son suivi et ses recommandations méthodologiques.

Enfin, j’adresse mes remerciements à mes enseignants à ESPRIT, à mes collègues et à toutes les personnes qui ont contribué, directement ou indirectement, à la réussite de ce travail.

---PAGEBREAK---

# Résumé

Le présent rapport décrit le travail réalisé dans le cadre d’un stage effectué en 2026 au sein de Tanit Jobs. Le projet porte sur l’analyse, la conception et le développement d’une application web de gestion intégrée de la filière des dattes. La solution, appelée « Gestion de Dattes », répond aux besoins d’une entreprise de conditionnement organisée en wakalas : réception des dattes, pesée caisse par caisse, génération des bons d’achat, suivi des paiements aux agriculteurs, gestion des stocks, ventes, encaissements, dépenses et clôture des saisons.

L’application adopte une architecture multi-tenant afin de séparer strictement les données de chaque wakala. Elle intègre une authentification par adresse électronique ou par Google, une gestion des rôles et permissions, un journal d’audit, trois langues, deux thèmes visuels et une interface responsive. Le suivi des caisses distingue le stock appartenant à la wakala de celui appartenant aux clients et conserve un journal immuable des entrées, sorties, prêts et retours.

La solution est construite avec Next.js, React, TypeScript, Prisma et PostgreSQL sur Neon. Les règles métier sensibles sont exécutées côté serveur dans des transactions. La validation repose sur Zod, tandis que l’interface utilise Tailwind CSS et les composants shadcn/ui. Le projet a également donné lieu à des tests unitaires, des scénarios d’intégration, des vérifications de compilation et une documentation UML.

Mots-clés : gestion des dattes, ERP, Next.js, TypeScript, Prisma, PostgreSQL, multi-tenant, stock, pesée, traçabilité.

---PAGEBREAK---

# Abstract

This report presents the work completed during a 2026 internship at Tanit Jobs. The project consists of analysing, designing and developing an integrated web application for date supply-chain management. The “Gestion de Dattes” solution supports the operational needs of a date packaging company organised into agencies, or wakalas: date reception, crate-by-crate weighing, purchase order generation, farmer payments, inventory, sales, customer payments, expenses and season closing.

The application follows a multi-tenant architecture that strictly isolates each wakala’s data. It provides email/password and Google authentication, role-based access control, audit logging, three languages, light and dark themes, and a responsive user interface. Crate inventory distinguishes company-owned crates from customer-owned crates and records every receipt, issue, loan and return in an immutable movement ledger.

The solution is built with Next.js, React, TypeScript, Prisma and PostgreSQL hosted on Neon. Sensitive business rules are executed on the server within database transactions. Zod is used for data validation, while Tailwind CSS and shadcn/ui support the user interface. The project also includes unit tests, integration scenarios, production build checks and UML documentation.

Keywords: date management, ERP, Next.js, TypeScript, Prisma, PostgreSQL, multi-tenancy, inventory, weighing, traceability.

---PAGEBREAK---

# Liste des abréviations

| Abréviation | Signification |
|---|---|
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| ERP | Enterprise Resource Planning |
| JWT | JSON Web Token |
| OAuth 2.0 | Open Authorization 2.0 |
| ORM | Object-Relational Mapping |
| PDF | Portable Document Format |
| RBAC | Role-Based Access Control |
| RSC | React Server Components |
| SSR | Server-Side Rendering |
| SQL | Structured Query Language |
| UI / UX | User Interface / User Experience |
| UML | Unified Modeling Language |

---PAGEBREAK---

# Sommaire

[SUMMARY]

---PAGEBREAK---

# Table des matières

[TOC]

---PAGEBREAK---

# Table des figures

[LIST_FIGURES]

---PAGEBREAK---

# Liste des tableaux

[LIST_TABLES]

---PAGEBREAK---

# Introduction générale

La transformation numérique ne concerne plus uniquement les grandes entreprises. Les structures agricoles et agroalimentaires ont elles aussi besoin de centraliser leurs opérations, de fiabiliser leurs calculs et de disposer d’indicateurs actualisés. Dans le secteur des dattes, la campagne mobilise plusieurs acteurs — agriculteurs, agents de réception, responsables de stock, clients et direction — et génère une succession de documents et de mouvements physiques qui doivent rester cohérents.

Une livraison de dattes ne se limite pas à une ligne saisie dans un tableau. Elle doit être pesée, valorisée, reliée à un agriculteur, intégrée au stock, puis éventuellement vendue. Le montant dû à l’agriculteur évolue au fil des paiements, tandis que la créance client évolue avec les encaissements. Les caisses utilisées pour transporter la récolte ont également un propriétaire, peuvent être prêtées et doivent être retournées. Une erreur de saisie ou l’absence de traçabilité peut donc affecter simultanément le stock, la trésorerie et la relation avec les partenaires.

Le projet « Gestion de Dattes » vise à réunir ces flux dans une application web sécurisée. Il ne s’agit pas seulement de remplacer le papier par des écrans, mais de formaliser des règles de gestion, de protéger l’intégrité des données et de proposer une vision consolidée de l’activité. Ce rapport présente le cadre du stage chez Tanit Jobs, l’étude fonctionnelle, les choix de conception, la réalisation de la solution et les validations effectuées.

Le rapport est organisé en cinq chapitres. Le premier présente l’entreprise d’accueil et le contexte du projet. Le deuxième expose les besoins et l’environnement de travail. Le troisième détaille la conception et l’architecture. Le quatrième décrit la réalisation des principaux modules. Le cinquième présente la stratégie de test, la sécurité, le déploiement et les difficultés rencontrées.

---PAGEBREAK---

# Chapitre 1 — Présentation du cadre du projet

## 1.1 Cadre du stage

Le stage s’est déroulé au sein de Tanit Jobs durant la période [date de début] – [date de fin] 2026, sous l’encadrement de [Nom et fonction de l’encadrant]. Il s’inscrit dans le cursus d’ingénieur en informatique à ESPRIT et a pour objectif de mettre en pratique les connaissances acquises en développement web, bases de données, génie logiciel, sécurité et conception orientée objet.

La mission confiée consistait à concevoir une application de gestion pour la filière des dattes. Le travail a couvert l’étude du besoin, la modélisation des données, la conception des interfaces, le développement full-stack, les tests et la documentation. Le projet a évolué de manière itérative : chaque module a été analysé, développé, testé puis amélioré à partir des retours fonctionnels.

| Élément | Information |
|---|---|
| Entreprise d’accueil | Tanit Jobs |
| Stagiaire | Ahmed Dhib |
| Établissement | ESPRIT |
| Classe | 3A63 — à confirmer |
| Année universitaire | 2026–2027 — à confirmer |
| Période | [À compléter] |
| Encadrant professionnel | [À compléter] |
| Encadrant académique | [À compléter] |
| Intitulé du projet | Conception et développement d’une application web de gestion de dattes |

## 1.2 Présentation de Tanit Jobs

Tanit Jobs est une plateforme numérique tunisienne consacrée à l’emploi. Son service met en relation les candidats et les recruteurs : consultation et recherche d’offres, création d’alertes, gestion d’un profil candidat, dépôt de candidature et publication d’annonces par les entreprises. Cette activité place le numérique, l’expérience utilisateur et la gestion fiable des données au centre de son fonctionnement.

L’environnement de Tanit Jobs constitue ainsi un cadre pertinent pour un stage en développement logiciel. La réalisation d’une application métier complète mobilise des compétences proches de celles nécessaires à une plateforme web professionnelle : authentification, gestion des utilisateurs, contrôle des accès, formulaires, recherche, données relationnelles, sécurité et adaptation aux différents écrans.

[FIGURE: Logo et présentation visuelle de Tanit Jobs | Insérer le logo officiel ou une capture de la page d’accueil]

### 1.2.1 Mission

La mission générale d’une plateforme d’emploi consiste à faciliter la rencontre entre l’offre et la demande sur le marché du travail. Elle doit rendre les annonces facilement accessibles, permettre aux candidats de présenter leur profil et fournir aux recruteurs des moyens structurés pour diffuser et suivre leurs opportunités.

### 1.2.2 Activités numériques

Les activités visibles de la plateforme comprennent la recherche multicritère d’offres, la consultation des fiches de poste, la création d’alertes, la candidature en ligne et la mise à disposition d’espaces dédiés aux candidats et aux employeurs. Ces fonctionnalités nécessitent une attention particulière à la qualité de l’interface, à la protection des données personnelles et à la disponibilité du service.

### 1.2.3 Organisation d’accueil

L’organisation détaillée de l’équipe dans laquelle le stage a été réalisé devra être validée avec l’entreprise. Le schéma suivant est réservé à la présentation de la direction, du service technique et de la position du stagiaire.

[FIGURE: Organigramme de Tanit Jobs et positionnement du stagiaire | À compléter avec les informations de l’entreprise]

## 1.3 Présentation du projet

Le projet concerne une entreprise de conditionnement et de commercialisation de dattes, appelée KAYEN dans l’interface. Son fonctionnement repose sur des wakalas, c’est-à-dire des agences qui gèrent leurs propres agriculteurs, clients, stocks, paiements et campagnes. L’application doit pouvoir servir plusieurs wakalas sans mélanger leurs données.

Le cycle métier commence par la réception des dattes apportées par un agriculteur. La récolte est pesée caisse par caisse pour calculer le poids net, puis valorisée à travers un bon d’achat. Les dattes acceptées entrent en stock. Elles peuvent ensuite être vendues à des clients et réglées par plusieurs encaissements. En parallèle, l’entreprise suit les paiements aux agriculteurs, les dépenses, les caisses prêtées et les bilans de saison.

## 1.4 Étude de l’existant

Avant la mise en place de l’application, le suivi peut être réparti entre des registres papier, des feuilles de calcul et des échanges informels. Chaque service conserve une partie de l’information : la réception connaît les quantités livrées, le responsable de stock connaît les lots disponibles, la comptabilité suit les montants et le responsable des caisses note les prêts.

Cette organisation permet de démarrer rapidement, mais elle devient fragile dès que le volume augmente. Une même donnée est recopiée plusieurs fois. Le poids net peut être calculé avec une tare incorrecte. Un paiement peut ne pas être relié au bon d’achat correspondant. Un lot issu d’une ancienne campagne peut être confondu avec le stock de l’année courante. Enfin, la direction ne dispose pas d’une vue consolidée en temps réel.

## 1.5 Critique de l’existant

- Les informations sont dispersées et difficiles à consolider.
- Les calculs manuels augmentent le risque d’erreur sur le poids net et les montants.
- La dette envers un agriculteur et la créance envers un client ne sont pas connues instantanément.
- Les campagnes successives ne sont pas suffisamment séparées.
- Le stock des caisses ne distingue pas toujours le propriétaire réel.
- Les corrections peuvent effacer la trace de l’opération initiale.
- L’accès aux données n’est pas contrôlé selon le rôle de l’utilisateur.
- Les listes volumineuses deviennent lentes et difficiles à rechercher.
- Les documents de gestion doivent être préparés manuellement.

## 1.6 Solution proposée

La solution proposée est un ERP web modulaire accessible depuis un navigateur. Elle centralise les référentiels, les opérations physiques et les flux financiers. Chaque utilisateur se connecte, choisit sa wakala et ne voit que les fonctions autorisées par son rôle. Les données sont validées côté serveur et les opérations sensibles sont exécutées dans des transactions de base de données.

L’application fournit un tableau de bord avec des indicateurs et des alertes, des pages de gestion paginées, des filtres stockés dans l’URL, des exports PDF et Excel et un journal d’audit. Elle fonctionne en français, anglais et arabe, propose un thème clair et un thème sombre et s’adapte aux téléphones, tablettes et ordinateurs.

## 1.7 Méthodologie de travail

Le développement a suivi une démarche incrémentale proche de Scrum. Le besoin global a été découpé en modules cohérents. Chaque itération comprenait une analyse, une modification du modèle de données si nécessaire, le développement des services, la création des interfaces, puis une phase de validation.

| Itération | Livrables principaux |
|---|---|
| 1 | Authentification, sélection de wakala et structure du tableau de bord |
| 2 | Référentiels : régions, agriculteurs, clients, livreurs et types |
| 3 | Réception des dattes, pesées et bons d’achat |
| 4 | Stock de dattes, ventes, encaissements et documents PDF |
| 5 | Paiements agriculteurs, dépenses et bilan financier |
| 6 | Saisons, bilans provisoires et clôture |
| 7 | Refonte du stock de caisses par propriétaire et journal des mouvements |
| 8 | Thèmes, internationalisation, responsive, optimisation et tests |

[FIGURE: Planification du projet sous forme de diagramme de Gantt | Prévoir les dates réelles du stage]

## 1.8 Conclusion du chapitre

Ce chapitre a présenté l’environnement du stage, le rôle de Tanit Jobs et le problème métier traité. L’étude de l’existant montre que la centralisation ne suffit pas : la solution doit également assurer la cohérence, la sécurité et la traçabilité. Le chapitre suivant formalise ces attentes en besoins fonctionnels et non fonctionnels.

---PAGEBREAK---

# Chapitre 2 — Spécification des besoins et environnement de travail

## 2.1 Identification des acteurs

L’application distingue les utilisateurs par rôle. Le rôle n’est pas seulement utilisé pour masquer les boutons : chaque action sensible vérifie l’autorisation côté serveur.

| Acteur | Responsabilités principales |
|---|---|
| Administrateur | Administration complète, utilisateurs, rôles, saisons et clôture |
| Agent | Saisie opérationnelle des réceptions, pesées, ventes et règlements |
| Responsable de stock | Consultation et gestion des stocks, caisses et bons d’achat |
| Laborantin | Consultation des réceptions et gestion des analyses de qualité |
| Direction | Consultation des indicateurs, finances, bilans et audit |
| Agriculteur | Acteur métier externe qui livre les dattes et reçoit les paiements |
| Client | Acteur métier externe qui achète les dattes ou apporte ses propres caisses |

## 2.2 Besoins fonctionnels

### 2.2.1 Authentification et profil

L’utilisateur doit pouvoir se connecter par adresse électronique et mot de passe ou par Google OAuth. Après une première connexion, il choisit une wakala parmi celles auxquelles il appartient. Un nouveau compte reçoit le rôle utilisateur simple par défaut et ne doit jamais obtenir automatiquement des droits administrateur. Un utilisateur connecté peut consulter son profil, modifier son nom et, pour un compte local, changer son mot de passe après vérification du mot de passe actuel.

### 2.2.2 Gestion multi-Wakala

Un même utilisateur peut appartenir à plusieurs wakalas avec des rôles différents. Le système doit conserver la wakala active dans la session et appliquer son identifiant à toutes les requêtes. L’écran de sélection permet de choisir une agence, d’en créer une selon les règles prévues et de se déconnecter.

### 2.2.3 Référentiels

Les référentiels regroupent les régions, agriculteurs, clients, livreurs, types de dattes et types de caisses. Ils alimentent les formulaires métier et doivent être filtrables, paginés et protégés contre les suppressions qui rendraient des opérations historiques incohérentes.

### 2.2.4 Réception des dattes

La page « Réception de dattes » enregistre l’arrivée d’une récolte : agriculteur, numéro de lot, date, types de dattes, types de caisses et quantité déclarée. Le numéro de lot est unique dans une wakala. La réception reste reliée aux pesées, au bon d’achat et au stock généré.

### 2.2.5 Pesée

La pesée s’effectue caisse par caisse. Pour chaque combinaison entre type de datte et type de caisse, l’utilisateur saisit les poids bruts individuels, la tare et le prix au kilogramme. Le système calcule le poids net et refuse les valeurs incohérentes. La validation met à jour la réception, crée le bon d’achat, alimente le stock de dattes et traite le retour des caisses prêtées.

### 2.2.6 Gestion du stock de caisses

Le module distingue trois notions : le stock physique total, le stock appartenant à la wakala et le stock appartenant aux clients. Une réception de caisses apportées par un camion crédite le compte du client propriétaire. Un prêt à un agriculteur peut être réparti entre plusieurs sources. Chaque mouvement d’entrée ou de sortie est enregistré dans un journal en lecture seule.

### 2.2.7 Achats et paiements

Le bon d’achat matérialise la dette envers l’agriculteur. Il est généré à partir des données de pesée et ne peut exister qu’une fois par réception. Plusieurs paiements peuvent être enregistrés jusqu’au règlement complet. Le statut « en attente », « partiel » ou « payé » est déduit des montants et non choisi arbitrairement.

### 2.2.8 Stock de dattes et ventes

Le stock doit être consultable par variété et par lot. Chaque lot conserve sa saison d’origine. Une vente choisit un client, un lot, une quantité et un prix. Le système vérifie le stock disponible, décrémente le lot et crée la créance correspondante. Une vente peut consommer des caisses de la wakala ou des caisses appartenant au client selon une répartition explicite.

### 2.2.9 Finance et saisons

Le module financier consolide les achats, paiements, ventes, encaissements et dépenses. Une saison représente une campagne annuelle. Une seule saison peut être ouverte par wakala. La clôture vérifie les opérations incomplètes, génère un bilan final figé et rend les opérations de la campagne en lecture seule.

### 2.2.10 Administration et audit

L’administrateur gère les utilisateurs et leurs rôles. Le journal d’audit indique l’acteur, l’action, la cible, la date et des détails structurés. Les modifications sensibles doivent rester retraçables, y compris lorsqu’une opération est annulée.

## 2.3 Besoins non fonctionnels

| Besoin | Réponse retenue |
|---|---|
| Sécurité | Authentification Auth.js, hachage bcrypt, OAuth Google et permissions serveur |
| Isolation | Filtrage systématique par tenantId et relations multi-tenant |
| Intégrité | Contraintes SQL, validations Zod et transactions Prisma |
| Performance | Pagination serveur, agrégations SQL, requêtes parallèles, filtres temporisés |
| Traçabilité | AuditLog et journal immuable des mouvements de caisses |
| Ergonomie | shadcn/ui, messages de validation, toasts et navigation structurée |
| Responsive | Mise en page adaptée aux mobiles, tablettes et ordinateurs |
| Accessibilité | Libellés, navigation clavier, contrastes et composants Radix UI |
| Internationalisation | Français, anglais et arabe avec prise en charge RTL |
| Maintenabilité | TypeScript strict et séparation actions/services/repositories |
| Disponibilité | Base PostgreSQL managée sur Neon et gestion des erreurs de connexion |
| Portabilité | Application web déployable sur Vercel ou une plateforme Node compatible |

## 2.4 Règles de gestion majeures

- RG01 — Une donnée métier appartient toujours à une wakala.
- RG02 — Un utilisateur ne peut agir que dans une wakala à laquelle il est rattaché.
- RG03 — Une seule saison peut être ouverte simultanément dans une wakala.
- RG04 — Une réception de dattes ne possède qu’un seul bon d’achat.
- RG05 — Le poids net est calculé et ne doit pas être saisi directement.
- RG06 — Le stock de dattes ne peut pas devenir négatif.
- RG07 — Le stock de caisses est séparé selon le propriétaire.
- RG08 — Une sortie de caisses doit référencer une source disposant d’un solde suffisant.
- RG09 — Une annulation crée une compensation au lieu d’effacer l’historique.
- RG10 — Le statut d’un paiement dépend des montants cumulés.
- RG11 — Une saison clôturée ne peut pas être rouverte.
- RG12 — Une opération non autorisée doit être refusée côté serveur.

## 2.5 Environnement matériel

| Composant | Configuration utilisée ou recommandée |
|---|---|
| Processeur | Intel Core i5/i7 ou équivalent |
| Mémoire vive | 16 Go recommandés |
| Stockage | SSD 512 Go |
| Système | Windows 10/11, Linux ou macOS |
| Connexion | Accès Internet stable pour Neon, Google OAuth et le déploiement |
| Affichage | Écran Full HD pour le développement ; validation sur plusieurs résolutions |

## 2.6 Environnement logiciel et technologique

| Couche | Technologie | Rôle dans le projet |
|---|---|---|
| Framework | Next.js 16.3 | Routage App Router, rendu serveur et Server Actions |
| Interface | React 19 | Composants interactifs et gestion d’état |
| Langage | TypeScript 5 | Typage statique du front et du serveur |
| Style | Tailwind CSS 4 | Design responsive et thèmes |
| Composants | shadcn/ui et Radix UI | Formulaires, dialogues, menus et accessibilité |
| Base | PostgreSQL sur Neon | Persistance relationnelle managée |
| ORM | Prisma 7.9 | Schéma, migrations, requêtes et transactions |
| Authentification | Auth.js / NextAuth 5 | Sessions, credentials et Google OAuth |
| Validation | Zod 4 | Validation des entrées côté serveur |
| Formulaires | React Hook Form | Gestion des champs et erreurs |
| Graphiques | Recharts | Courbes, indicateurs et diagrammes |
| Tableaux | TanStack Table | Colonnes, tri et affichage des listes |
| Export | jsPDF et SheetJS | Documents PDF et fichiers Excel |
| Exécution | Bun | Scripts, installation, tests et build |
| Versionnement | Git | Historique des modifications |
| Modélisation | PlantUML | Diagrammes de classes, cas d’utilisation et séquences |

[FIGURE: Logos des technologies principales utilisées | Next.js, React, TypeScript, Prisma, PostgreSQL, Tailwind CSS et Bun]

## 2.7 Conclusion du chapitre

Les besoins montrent que le projet combine des opérations de gestion classiques et des contraintes fortes de cohérence. Les stocks, règlements et saisons nécessitent des garanties qui dépassent l’interface. Le chapitre suivant expose l’architecture choisie pour porter ces règles de manière durable.

---PAGEBREAK---

# Chapitre 3 — Analyse et conception

## 3.1 Architecture générale

L’application adopte une architecture en couches. Le composant React collecte les données et appelle une Server Action. Celle-ci vérifie la session, identifie la wakala active et valide les entrées. Le service applique les règles métier et gère les transactions. Le repository construit enfin les requêtes Prisma adressées à PostgreSQL.

Cette séparation limite le couplage. Une page ne connaît pas la structure détaillée de la base, un repository ne décide pas des droits d’accès et les règles métier ne sont pas dispersées dans les composants visuels. Elle facilite aussi les tests, car les validateurs et services peuvent être vérifiés indépendamment.

[FIGURE: Architecture logique en couches de l’application | Navigateur → Server Action → Service → Repository → Prisma/PostgreSQL]

## 3.2 Architecture multi-tenant

L’entité Tenant représente une wakala. L’association TenantUser relie un utilisateur à une ou plusieurs wakalas et porte son rôle dans chaque contexte. Ainsi, un utilisateur peut être administrateur dans une agence et simple agent dans une autre.

Chaque table métier contient tenantId. Les accès par identifiant combinent l’identifiant de l’objet et celui de la wakala. Cette règle évite qu’un utilisateur puisse lire ou modifier une donnée appartenant à une autre agence, même s’il connaît son identifiant technique.

## 3.3 Conception de la sécurité

L’authentification locale compare le mot de passe fourni avec une empreinte bcrypt. Google OAuth permet une connexion fédérée sans exposer le mot de passe Google à l’application. Après authentification, le jeton de session contient l’identité et le contexte utile, tandis que les permissions restent vérifiées lors de chaque opération sensible.

La matrice RBAC associe une permission métier à un ensemble de rôles. Par exemple, consulter un stock, créer une réception de caisses et clôturer une saison correspondent à des permissions différentes. Le contrôle serveur empêche le contournement par un appel direct à une action.

[FIGURE: Cas d’utilisation global de l’application | Utiliser docs/uml/svg/cas-utilisation-global.svg]

## 3.4 Modèle de données

Le modèle comporte plusieurs domaines reliés. Cette organisation permet de représenter le cycle complet sans stocker plusieurs fois la même information.

| Domaine | Entités principales |
|---|---|
| Sécurité | Tenant, User, Role, TenantUser, AuditLog |
| Référentiels | Region, Agriculteur, Client, Livreur, TypeDate, TypeCaisse |
| Campagnes | Saison, BilanSaison |
| Réceptions | Livraison, LivraisonTypeCaisse, Pesee, PeseeCaisse |
| Qualité | Echantillon, Analyse |
| Caisses | StockCaisseWakala, StockCaisseClient, ReceptionCaisses, PretCaisse, MouvementCaisse |
| Achats | BonAchat, PaiementAgriculteur |
| Stock et ventes | StockDate, Vente, EncaissementClient, VenteCaisse |
| Charges | DepenseAutre |

[FIGURE: Diagramme de classes du noyau métier | Utiliser docs/uml/svg/diagramme-classes-noyau.svg]

[FIGURE: Diagramme de classes complet | Utiliser docs/uml/svg/diagramme-classes.svg sur une page paysage]

## 3.5 Choix de modélisation importants

### 3.5.1 Pesée à deux niveaux

Pesee représente une combinaison de type de datte et de type de caisse. PeseeCaisse stocke le poids brut de chaque caisse individuelle. Le poids net est obtenu en soustrayant la tare totale du poids brut. Les valeurs monétaires et les poids utilisent des nombres décimaux afin d’éviter les erreurs d’arrondi des nombres flottants.

### 3.5.2 Bon d’achat unique

Le champ livraisonId du bon d’achat est unique. La base garantit ainsi qu’une même réception ne peut pas générer deux dettes différentes envers l’agriculteur. Cette contrainte reste valable même en cas de deux requêtes simultanées.

### 3.5.3 Saison d’origine et saison de transaction

Un lot conserve la saison durant laquelle les dattes sont entrées en stock. Une vente conserve la saison ouverte au moment de la transaction. Cette distinction permet de vendre un stock reporté d’une année précédente tout en attribuant correctement le chiffre d’affaires à la campagne de vente.

### 3.5.4 Propriété des caisses

Les caisses ne sont pas toutes la propriété de la wakala. StockCaisseWakala représente le stock propre, tandis que StockCaisseClient conserve un solde par client et type de caisse. Les tables de sources enregistrent la répartition exacte utilisée par une vente ou un prêt.

### 3.5.5 Journal immuable

MouvementCaisse enregistre chaque entrée et sortie. Une correction ne supprime pas l’événement initial ; elle crée un mouvement inverse avec une référence et un motif. Ce choix rend l’historique vérifiable et facilite l’audit.

## 3.6 Cas d’utilisation détaillé — Enregistrer une vente

| Rubrique | Description |
|---|---|
| Acteur principal | Agent ou administrateur |
| Préconditions | Session valide, wakala active, saison ouverte, client et lot disponibles |
| Déclencheur | Clic sur « Nouvelle vente » |
| Scénario nominal | Choix du client, du lot, de la quantité, du prix et des sources de caisses, puis validation |
| Postconditions | Vente créée, stock décrémenté, sources de caisses débitées, audit enregistré |
| Exceptions | Permission absente, stock insuffisant, source invalide ou base indisponible |

La transaction garantit que la vente et les diminutions de stock réussissent ensemble. Si une seule source de caisses est insuffisante, aucune partie de la vente n’est conservée.

[FIGURE: Cas d’utilisation détaillé « Enregistrer une vente » | Utiliser docs/uml/svg/cas-utilisation-detaille-vente.svg]

[FIGURE: Diagramme de séquence « Enregistrer une vente » | Utiliser docs/uml/svg/sequence-enregistrer-vente.svg]

## 3.7 Cas d’utilisation détaillé — Clôturer une saison

| Rubrique | Description |
|---|---|
| Acteur principal | Administrateur |
| Préconditions | Saison ouverte et aucun point bloquant |
| Contrôles | Réceptions sans pesée, bons d’achat manquants et cohérence des indicateurs |
| Résultat | Bilan final figé, saison clôturée et audit écrit |
| Particularité | La vérification est répétée dans la transaction |

Les avertissements tels que les créances restantes ou les caisses encore prêtées sont affichés, mais la décision finale appartient à l’administrateur. En revanche, une réception non pesée ou non valorisée bloque la clôture car le bilan serait faux.

[FIGURE: Cas d’utilisation détaillé « Clôturer une saison » | Utiliser docs/uml/svg/cas-utilisation-detaille-cloture.svg]

[FIGURE: Diagramme de séquence « Clôturer une saison » | Utiliser docs/uml/svg/sequence-cloturer-saison.svg]

## 3.8 Cas d’utilisation détaillé — Gérer les caisses

Le responsable peut réceptionner des caisses appartenant à un client, ajuster le stock propre de la wakala avec un motif, prêter des caisses à un agriculteur et consulter l’historique. Le système calcule les disponibilités par propriétaire et interdit tout débit qui rendrait un solde négatif.

[FIGURE: Cas d’utilisation « Gestion du stock de caisses » | Utiliser docs/uml/svg/cas-utilisation-stock-caisses.svg]

[FIGURE: Séquence « Réception de caisses client » | Utiliser docs/uml/svg/sequence-reception-caisses.svg]

[FIGURE: Séquence « Prêt et retour de caisses » | Utiliser docs/uml/svg/sequence-pret-retour-caisses.svg]

[FIGURE: Séquence « Annuler une réception de dattes » | Utiliser docs/uml/svg/sequence-annuler-reception-dattes.svg]

## 3.9 Conclusion du chapitre

La conception associe une architecture en couches, une isolation multi-tenant et un modèle relationnel adapté aux règles du métier. Les contraintes critiques sont placées au niveau serveur ou base de données. Le chapitre suivant montre comment ces principes se traduisent dans l’interface et les modules réalisés.

---PAGEBREAK---

# Chapitre 4 — Réalisation de l’application

## 4.1 Organisation du projet

Le projet Next.js utilise l’App Router. Les pages sont placées dans src/app, les composants réutilisables dans src/components, les actions serveur dans src/actions, les règles métier dans src/services, les accès aux données dans src/repositories et les validateurs dans src/validators. Le schéma Prisma et les migrations décrivent l’évolution de la base.

Cette organisation rend le chemin d’une opération lisible. Par exemple, la création d’une réception de caisses part d’un dialogue React, passe par une Server Action validée par Zod, entre dans un service transactionnel, puis utilise le repository pour créditer le stock et écrire le mouvement.

## 4.2 Authentification et sélection de la wakala

La page de connexion reprend l’identité visuelle de l’application et fonctionne dans les thèmes clair et sombre. Elle propose la connexion par Google ou par identifiants locaux. Les messages d’erreur sont affichés sans révéler d’informations sensibles.

Après connexion, l’écran de sélection affiche les wakalas accessibles avec le rôle correspondant. Le contraste des cartes est maintenu au survol. Un bouton de déconnexion est disponible directement sur cet écran. Un nouveau compte Google est créé avec un rôle utilisateur simple ; une affectation explicite est nécessaire pour obtenir des droits supérieurs.

[FIGURE: Page de connexion — thème clair | Insérer une capture de /login]

[FIGURE: Page de connexion — thème sombre et connexion Google | Insérer une capture de /login en mode sombre]

[FIGURE: Sélection d’une wakala | Insérer une capture de /select-wakala]

## 4.3 Tableau de bord

Le tableau de bord présente les indicateurs essentiels : quantité de dattes en stock, quantité nette reçue, chiffre d’affaires, trésorerie, dettes envers les agriculteurs et créances clients. Des graphiques montrent l’évolution de l’activité et la répartition du stock par variété. Les alertes signalent les dossiers incomplets et les actions rapides donnent accès aux opérations fréquentes.

Le diagramme en anneau reste réactif à la taille du conteneur et affiche au centre le total calculé. Les couleurs des séries restent cohérentes entre le thème clair et le thème sombre. Le changement de langue met immédiatement à jour les libellés des indicateurs.

[FIGURE: Tableau de bord en thème clair | Insérer la capture finale du dashboard]

[FIGURE: Tableau de bord en thème sombre | Insérer la capture finale du dashboard]

## 4.4 Référentiels

Les pages des régions, agriculteurs, clients, livreurs et types utilisent une structure commune : en-tête, indicateurs, filtres, tableau et pagination. Les formulaires de création et de modification emploient des dialogues responsive. Les valeurs obligatoires sont indiquées, les messages de validation apparaissent sous les champs et les suppressions demandent une confirmation.

Les types de caisses définissent désormais uniquement les caractéristiques du contenant, notamment le nom et la tare. Le stock n’est plus modifié depuis ce référentiel : il est géré dans le module dédié, ce qui sépare la définition d’un type et son inventaire réel.

[FIGURE: Gestion des agriculteurs et filtres | Insérer une capture de /dashboard/agriculteurs]

## 4.5 Réception de dattes

La page anciennement nommée « Livraisons » est présentée à l’utilisateur comme « Réception de dattes ». Elle affiche les réceptions enregistrées et permet d’en créer une nouvelle. Le formulaire relie le lot à un agriculteur et décrit les caisses et variétés apportées.

La recherche est temporisée afin de ne pas envoyer une requête à chaque frappe. Les filtres vivent dans l’URL, ce qui permet de partager ou recharger une vue sans perdre son état. La pagination et le tri sont traités par la base, et non après chargement d’une liste complète.

[FIGURE: Liste et formulaire de réception de dattes | Insérer une capture de /dashboard/livraisons]

## 4.6 Assistant de pesée

Le formulaire de pesée guide l’utilisateur étape par étape. Il sélectionne une réception, choisit les types de dattes et de caisses, puis saisit chaque poids brut. Le poids net, la tare totale et le montant sont recalculés en temps réel. Les dimensions des dialogues, listes déroulantes et tableaux ont été adaptées aux petits écrans pour éviter tout défilement horizontal inutile.

Lors de la validation, la création des pesées, la mise à jour de la réception, la génération du bon d’achat, l’entrée en stock et le retour automatique des caisses sont exécutés dans une même transaction. Une erreur provoque un rollback complet.

[FIGURE: Assistant de nouvelle pesée | Insérer une capture de /dashboard/pesees]

## 4.7 Stock de caisses

Le module « Stock de Caisses » comporte six vues : vue globale, stock de la wakala, stock des clients, réceptions de caisses, prêts et mouvements. Les indicateurs distinguent le stock physique, les caisses propres, les caisses clients et les prêts en cours.

La vue Wakala permet d’ajuster le stock propre par type de caisse. L’utilisateur saisit la nouvelle quantité et un motif obligatoire. L’interface applique immédiatement la valeur de manière optimiste, puis confirme avec le serveur. En cas d’échec, elle restaure l’ancienne valeur.

La vue Clients indique, pour chaque propriétaire et type, les quantités apportées, sorties et disponibles. Une réception de camion peut contenir plusieurs lignes. L’annulation d’une réception ne supprime pas l’historique : elle débite le compte par un mouvement compensatoire.

Le formulaire de prêt affiche la disponibilité totale et sa répartition entre la wakala et les clients. Le nombre prêté doit être entièrement réparti entre les sources choisies. Cette règle empêche un prêt non couvert par le stock réel.

Le changement d’onglet s’effectue côté client sans nouvelle requête. Le filtre de période utilise un calendrier Shadcn responsive avec bouton « Appliquer ». Les changements rapprochés des filtres sont regroupés afin de limiter les requêtes serveur.

[FIGURE: Vue globale du stock de caisses | Insérer une capture de /dashboard/stock-caisses]

[FIGURE: Gestion du stock Wakala et ajustement | Insérer la vue Wakala]

[FIGURE: Formulaire de prêt multi-source | Insérer le dialogue « Nouveau prêt »]

## 4.8 Stock de dattes

Le stock de dattes est agrégé par variété et détaillé par lot. Chaque ligne indique la quantité disponible et permet d’identifier la saison d’origine. Cette information est importante lors de la vente d’un stock reporté d’une ancienne campagne.

Les agrégations sont réalisées en base avec les fonctions SQL exposées par Prisma. Le navigateur reçoit uniquement les données nécessaires à la page affichée, ce qui réduit le volume transféré et conserve de bonnes performances lorsque le nombre de lots augmente.

[FIGURE: Stock de dattes par variété et détail des lots | Insérer une capture de /dashboard/stock-dattes]

## 4.9 Bons d’achat et paiements agriculteurs

Le bon d’achat reprend le lot, l’agriculteur, le poids net, le prix au kilogramme et le montant total. Il peut être exporté en PDF avec la charte de la wakala. La liste des paiements indique le montant déjà réglé et le solde restant.

L’enregistrement d’un paiement vérifie qu’il ne dépasse pas le solde. Le statut du bon est recalculé après l’opération. Les filtres permettent de rechercher par agriculteur, statut, saison ou période.

[FIGURE: Bons d’achat et document PDF | Insérer la liste et un exemple anonymisé]

[FIGURE: Paiements aux agriculteurs | Insérer une capture du module financier]

## 4.10 Ventes et encaissements

Le formulaire de vente affiche les lots disponibles, y compris ceux provenant d’une saison antérieure. Après sélection du client et du lot, il calcule le montant et demande la répartition des caisses consommées. Le serveur vérifie simultanément le stock de dattes et le stock des caisses.

La facture PDF utilise une numérotation structurée et reprend les informations de l’entreprise et du client. Les encaissements successifs diminuent la créance. Le tableau distingue les ventes en attente, partielles et payées.

[FIGURE: Création d’une vente et choix du lot | Insérer le formulaire de vente]

[FIGURE: Facture de vente générée en PDF | Insérer un exemple anonymisé]

## 4.11 Finance et bilan

Le bilan financier consolide les encaissements, les paiements aux agriculteurs, les autres dépenses et la trésorerie nette. Les indicateurs utilisent les mêmes filtres de saison et de période que les tableaux détaillés. Les listes peuvent être exportées en PDF ou Excel.

Les dépenses sont catégorisées et reliées à la saison de transaction. Les totaux sont calculés sur l’ensemble du résultat filtré, et non uniquement sur la page visible. Cette règle évite qu’un indicateur change artificiellement lors de la pagination.

[FIGURE: Tableau de bord financier | Insérer une capture de /dashboard/finance]

## 4.12 Saisons et clôture

Une saison ouverte autorise les opérations d’écriture. Lorsqu’aucune saison n’est ouverte, les écrans affichent une alerte et empêchent les nouvelles saisies. L’utilisateur peut néanmoins consulter les campagnes clôturées en lecture seule.

Avant la clôture, une checklist distingue les blocages et les avertissements. Un bilan provisoire peut être généré sans modifier le statut. La clôture finale crée un instantané versionné, marque la saison comme clôturée et journalise l’identité de l’administrateur.

[FIGURE: Checklist et clôture d’une saison | Insérer une capture de la page de clôture]

## 4.13 Utilisateurs, rôles et profil

Les pages d’administration présentent les utilisateurs et leur rôle dans la wakala active. Les formulaires affichent clairement le rôle sélectionné, les champs de mot de passe optionnels et leurs messages d’aide. Le profil indique la méthode de connexion. Les champs de mot de passe possèdent des boutons permettant de masquer ou d’afficher la valeur saisie.

[FIGURE: Gestion des utilisateurs et rôles | Insérer les écrans /dashboard/users et /dashboard/roles]

[FIGURE: Profil utilisateur et changement de mot de passe | Insérer une capture de /dashboard/profile]

## 4.14 Journal d’audit

Le journal d’audit est réservé aux rôles autorisés. Il permet de filtrer par utilisateur, action, date ou texte. Chaque ligne expose l’opération, sa cible, son auteur et les informations complémentaires. Les couleurs restent lisibles dans les deux thèmes.

[FIGURE: Journal d’audit avec filtres | Insérer une capture de /dashboard/audit-logs]

## 4.15 Design, thèmes et responsive

L’interface utilise des variables de thème pour les couleurs de fond, cartes, bordures, textes et états. Le thème clair adopte des surfaces crème et blanches avec un accent ambre. Le thème sombre conserve l’identité brune et dorée de la filière des dattes. Les icônes reprennent des couleurs fonctionnelles : vert pour les valeurs positives, rouge pour les alertes, bleu pour l’information et ambre pour les actions principales.

Le responsive a été vérifié sur mobile, tablette et ordinateur. Les tableaux larges disposent d’un défilement horizontal contrôlé, tandis que certaines vues passent en cartes sur mobile. Les dialogues utilisent une largeur relative à l’écran, une hauteur maximale et un défilement interne.

[FIGURE: Comparaison responsive mobile, tablette et ordinateur | Insérer trois captures de la même fonctionnalité]

## 4.16 Conclusion du chapitre

La réalisation couvre le cycle métier complet, depuis l’authentification jusqu’à la clôture. Les choix d’interface restent liés aux règles du domaine : les écrans guident la saisie, mais les garanties critiques sont appliquées côté serveur. Le dernier chapitre présente les tests et les mesures prises pour garantir la qualité de la solution.

---PAGEBREAK---

# Chapitre 5 — Tests, sécurité et déploiement

## 5.1 Stratégie de validation

La validation combine plusieurs niveaux. TypeScript détecte les incohérences de types. ESLint contrôle la qualité statique. Les tests unitaires vérifient les validateurs et fonctions critiques. Les scénarios d’intégration contrôlent les transactions sur une base PostgreSQL dédiée. Enfin, le build Next.js confirme que l’application peut être compilée pour la production.

| Niveau | Objectif | Outil ou commande |
|---|---|---|
| Typage | Détecter les incohérences avant exécution | bunx tsc --noEmit |
| Analyse statique | Contrôler les règles de code | bun run lint |
| Tests unitaires | Vérifier validations et calculs | bun test |
| Tests d’intégration | Vérifier transactions et isolation | Base Neon de test dédiée |
| Build | Valider le rendu de production | bun run build |
| Recette UI | Contrôler formulaires, thèmes et responsive | Navigateur et scénarios manuels |

## 5.2 Tests du stock de caisses

Les tests vérifient notamment l’acceptation d’une source Wakala, le refus d’une source client sans propriétaire, l’unicité des lignes de réception, la validation des ajustements, la répartition d’un prêt multi-source et l’impossibilité de vendre des caisses appartenant à un autre client.

Les tests de débit atomique simulent une demande supérieure au stock et contrôlent que la quantité ne devient jamais négative. Les scénarios d’intégration destructifs doivent être exécutés uniquement sur une base de test dédiée afin de ne pas modifier les données réelles.

[FIGURE: Résultats des tests et du build de production | Insérer une capture du terminal]

## 5.3 Sécurité applicative

La sécurité est traitée à plusieurs niveaux :

- mots de passe hachés avec bcrypt ;
- secrets OAuth conservés dans les variables d’environnement ;
- validation de toutes les entrées avec Zod ;
- contrôle des permissions côté serveur ;
- requêtes isolées par tenantId ;
- transactions pour les écritures liées ;
- journalisation des opérations sensibles ;
- messages d’erreur ne révélant pas de données internes ;
- protection des routes par la session ;
- contraintes uniques au niveau PostgreSQL.

Le secret Google OAuth ne doit jamais être placé dans le dépôt ou dans une capture du rapport. En cas d’exposition, il doit être révoqué et régénéré dans Google Cloud Console.

## 5.4 Performance

La pagination serveur évite de charger toutes les lignes. Les recherches sont temporisées et les filtres de dates sont appliqués en une seule fois. Les requêtes indépendantes sont exécutées en parallèle. Les agrégations sont confiées à PostgreSQL. Les changements visuels locaux, comme l’ajustement du stock Wakala, utilisent une mise à jour optimiste suivie d’une synchronisation en arrière-plan.

La base Neon étant distante, la latence réseau reste visible lors de certaines opérations. Pour un déploiement réel en Tunisie, une région d’hébergement plus proche réduirait les temps de réponse. L’interface affiche néanmoins les états de chargement et conserve la navigation en cas d’erreur temporaire.

## 5.5 Déploiement

L’application peut être déployée sur Vercel. La base PostgreSQL est fournie par Neon. Les variables nécessaires incluent l’URL de base, les paramètres Auth.js, le secret de session et les identifiants Google OAuth. Les URI de redirection doivent être déclarées séparément pour localhost et pour le domaine de production.

Le processus recommandé est le suivant : générer le client Prisma, vérifier les migrations, exécuter les tests, construire l’application puis déployer. Les migrations destructives doivent être précédées d’une sauvegarde et testées sur une branche de base distincte.

[FIGURE: Architecture de déploiement | Navigateur → Vercel/Next.js → Neon PostgreSQL → Google OAuth]

## 5.6 Difficultés rencontrées et solutions

| Difficulté | Cause | Solution retenue |
|---|---|---|
| Hydratation du thème | Valeur différente entre serveur et navigateur | Attendre le montage avant d’afficher l’état dépendant du thème |
| Graphiques de taille négative | Conteneur non mesurable au premier rendu | Dimensions minimales et conteneur responsive |
| Latence des filtres | Navigation serveur répétée | Temporisation, regroupement des paramètres et bouton Appliquer |
| Stock de caisses incohérent | Stock confondu avec le référentiel de type | Tables de stock dédiées et journal de mouvements |
| Prêt provenant de plusieurs propriétaires | Source unique insuffisante | Modèle PretCaisseSource et formulaire de répartition |
| Annulation sans trace | Suppression de l’événement initial | Mouvement compensatoire immuable |
| Connexion Google | URI ou variables mal configurées | Configuration OAuth précise pour chaque environnement |
| Déconnexion non synchronisée | Toast persistant pendant la redirection | Fermeture du toast et état lié à la fin réelle de l’action |
| Responsive des dialogues | Largeurs fixes et listes trop longues | Grilles adaptatives, max-height et scroll interne |
| Connexion Neon instable | Latence ou réseau local | Gestion d’erreur et nouvelle tentative sans altérer les données |

## 5.7 Limites et perspectives

La solution peut encore évoluer. Une application mobile ou un mode hors connexion faciliterait la saisie sur le quai lorsque le réseau est faible. Des lecteurs de codes-barres pourraient identifier automatiquement les lots et les caisses. La base pourrait être rapprochée géographiquement des utilisateurs. Des tableaux comparatifs entre saisons et des prévisions de production pourraient enrichir l’aide à la décision.

D’autres perspectives concernent l’envoi automatique de documents, la signature électronique, les notifications aux agriculteurs, l’import comptable, la supervision technique et une couverture de tests de bout en bout plus large.

## 5.8 Conclusion du chapitre

Les tests et contrôles réalisés confirment que les règles centrales sont prises en charge par la solution. La sécurité repose sur plusieurs mécanismes complémentaires et la stratégie de déploiement sépare clairement les environnements. Les limites identifiées constituent des axes d’amélioration réalistes plutôt que des obstacles à l’utilisation actuelle.

---PAGEBREAK---

# Conclusion générale

Ce stage au sein de Tanit Jobs m’a permis de conduire un projet full-stack couvrant l’ensemble du cycle de développement : compréhension d’un domaine métier, spécification des besoins, conception de la base, développement des interfaces et services, gestion de la sécurité, tests et documentation.

L’application « Gestion de Dattes » apporte une réponse structurée aux difficultés du suivi manuel. Elle relie les réceptions, pesées, achats, stocks, ventes et règlements. Elle sépare les campagnes et les wakalas, applique une matrice de rôles et conserve la trace des opérations. La refonte du stock de caisses illustre l’importance de la modélisation : identifier le propriétaire et enregistrer chaque mouvement permet d’éviter des écarts que l’interface seule ne pourrait pas corriger.

Sur le plan technique, ce travail a renforcé ma maîtrise de Next.js, React, TypeScript, Prisma et PostgreSQL. Il m’a également sensibilisé à des sujets essentiels dans une application professionnelle : transactions, accès concurrents, multi-tenancy, OAuth, responsive design, internationalisation et gestion des erreurs réseau.

Au-delà des compétences techniques, ce projet m’a appris à transformer des retours utilisateurs en décisions de conception, à vérifier l’impact d’une modification sur plusieurs modules et à documenter les choix afin de rendre le système maintenable. Les perspectives proposées permettront de poursuivre cette démarche et d’adapter la solution à une exploitation plus large.

---PAGEBREAK---

# Bibliographie et webographie

1. Documentation officielle Next.js, App Router et Server Components : https://nextjs.org/docs
2. Documentation React : https://react.dev
3. Documentation TypeScript : https://www.typescriptlang.org/docs
4. Documentation Prisma ORM : https://www.prisma.io/docs
5. Documentation PostgreSQL : https://www.postgresql.org/docs
6. Documentation Neon : https://neon.tech/docs
7. Documentation Auth.js : https://authjs.dev
8. Documentation Zod : https://zod.dev
9. Documentation Tailwind CSS : https://tailwindcss.com/docs
10. Documentation shadcn/ui : https://ui.shadcn.com
11. Documentation PlantUML : https://plantuml.com
12. Tanit Jobs, plateforme d’emploi : https://www.tanitjobs.com

---PAGEBREAK---

# Annexe A — Matrice synthétique des permissions

| Domaine | Lecture | Création / modification | Administration |
|---|---|---|---|
| Utilisateurs et rôles | ADMIN, DIRECTION | ADMIN | ADMIN |
| Référentiels | Rôles opérationnels | ADMIN, AGENT selon le domaine | ADMIN |
| Réception de dattes | ADMIN, AGENT, STOCK, LABORANTIN, DIRECTION | ADMIN, AGENT, STOCK | ADMIN |
| Pesées | ADMIN, AGENT, STOCK, DIRECTION | ADMIN, AGENT | ADMIN |
| Stock de caisses | ADMIN, AGENT, STOCK, DIRECTION | Selon permission dédiée | ADMIN |
| Bons et paiements | ADMIN, AGENT, STOCK, DIRECTION | ADMIN, AGENT, STOCK | ADMIN |
| Ventes et encaissements | ADMIN, AGENT, STOCK, DIRECTION | ADMIN, AGENT | ADMIN |
| Finances | ADMIN, DIRECTION | ADMIN, DIRECTION | ADMIN |
| Saisons | ADMIN, DIRECTION et consultation autorisée | ADMIN, DIRECTION | Clôture : ADMIN |
| Audit | ADMIN, DIRECTION | Lecture seule | ADMIN |

# Annexe B — Guide d’installation

1. Installer Bun et Git.
2. Cloner le dépôt de l’application.
3. Exécuter bun install.
4. Copier les variables d’environnement et renseigner DATABASE_URL, AUTH_SECRET, AUTH_URL, AUTH_GOOGLE_ID et AUTH_GOOGLE_SECRET.
5. Exécuter bunx prisma generate.
6. Vérifier les migrations avec bunx prisma migrate status.
7. Lancer l’environnement local avec bun run dev.
8. Ouvrir http://localhost:3000.

# Annexe C — Emplacements des diagrammes

| Diagramme | Fichier à insérer |
|---|---|
| Cas d’utilisation global | docs/uml/svg/cas-utilisation-global.svg |
| Classes du noyau | docs/uml/svg/diagramme-classes-noyau.svg |
| Classes complet | docs/uml/svg/diagramme-classes.svg |
| Cas d’utilisation vente | docs/uml/svg/cas-utilisation-detaille-vente.svg |
| Séquence vente | docs/uml/svg/sequence-enregistrer-vente.svg |
| Cas d’utilisation clôture | docs/uml/svg/cas-utilisation-detaille-cloture.svg |
| Séquence clôture | docs/uml/svg/sequence-cloturer-saison.svg |
| Cas d’utilisation stock caisses | docs/uml/svg/cas-utilisation-stock-caisses.svg |
| Séquence réception caisses | docs/uml/svg/sequence-reception-caisses.svg |
| Séquence prêt et retour | docs/uml/svg/sequence-pret-retour-caisses.svg |
| Séquence annulation réception de dattes | docs/uml/svg/sequence-annuler-reception-dattes.svg |

# Annexe D — Informations à compléter avant remise

- Dates exactes du stage.
- Nom et fonction de l’encadrant professionnel.
- Nom de l’encadrant académique.
- Classe et année universitaire définitives.
- Adresse et identité juridique de Tanit Jobs si elles doivent apparaître.
- Logo officiel de Tanit Jobs et logo ESPRIT.
- Captures finales anonymisées.
- Validation de la table des matières et des numéros de page après insertion des images.
- Suppression de cette annexe avant la version finale si tous les champs ont été complétés.
