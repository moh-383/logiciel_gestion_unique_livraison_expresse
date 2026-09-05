# Cahier des charges : Logiciel de gestion des livraisons
## UNIQUE Livraison Expresse

Version 0.1 : Document de travail, à valider.
Équipe projet : Personne A & Personne B.

---

## 1. Contexte

UNIQUE Livraison Expresse est une structure de livraison qui communique principalement via une page Facebook. Le fonctionnement actuel est artisanal :

- Le client appelle (ou contacte via Facebook) pour demander une livraison.
- La structure ne détient **aucun stock** : elle passe systématiquement par un **fournisseur** chez qui la marchandise est récupérée.
- Un livreur est désigné, généralement par coordination téléphonique ou via des groupes WhatsApp.
- Le livreur récupère la marchandise chez le fournisseur puis la livre au client.

Il n'existe aujourd'hui aucun outil centralisé : ni pour les commandes, ni pour la position des livreurs, ni pour le paiement. Le pilotage se fait "à l'oreille", par appels et messages WhatsApp.

## 2. Objectifs du projet

Le client final a exprimé, sans cahier des charges formel, les besoins suivants :

1. Gérer sa structure de livraison depuis un outil unique.
2. Savoir où se trouvent ses livreurs à un instant donné.
3. Gérer les commandes de bout en bout.
4. Gérer les livreurs (statut, affectation, disponibilité).
5. Réduire la dépendance aux groupes WhatsApp pour la coordination opérationnelle.

**Objectif du projet, reformulé :** concevoir et livrer une plateforme composée d'un tableau de bord d'administration (web) et d'une application mobile pour les livreurs, permettant de centraliser clients, fournisseurs, commandes et livreurs, avec suivi de position et notifications, en remplacement de la coordination manuelle actuelle.

## 3. Modèle métier

```
Client → UNIQUE Livraison Expresse (dispatch) → Fournisseur → Livreur → Client
```

Cycle de vie d'une commande, dans sa forme la plus simple :

1. Le client contacte la structure et demande une livraison d'un produit précis chez un fournisseur précis.
2. Un opérateur (à la structure) crée la commande dans le système.
3. Un livreur est affecté (manuellement dans le MVP, automatiquement en V3).
4. Le livreur va chercher la marchandise chez le fournisseur.
5. Le livreur livre au client.
6. La commande est clôturée (et éventuellement le paiement encaissé).

## 4. Acteurs du système

| Acteur | Statut dans le MVP | Description |
|---|---|---|
| **Administrateur** | Oui | Accès complet : utilisateurs, fournisseurs, livreurs, commandes, statistiques. |
| **Dispatcher / Opérateur** | Oui | Crée les commandes, affecte les livreurs, suit les livraisons. (Peut être la même personne que l'Administrateur au démarrage.) |
| **Livreur** | Oui | Utilise l'application mobile : reçoit ses commandes, met à jour son statut et sa position, confirme la livraison. |
| **Client** | Non (V2/V3) | Pas d'accès direct au MVP — il continue d'appeler/contacter par Facebook. Un compte client et un historique existent en base, mais sans interface dédiée. |
| **Fournisseur** | Non (V2/V3) | Simple fiche de référence dans le MVP (nom, contact, adresse, produits). Pas d'interface propre. |
| **Comptable / Superviseur** | Non (V3) | Rôles supplémentaires envisageables une fois le cœur du système stabilisé. |

> Choix assumé : on ne construit **pas** de rôles ou d'interfaces pour Client et Fournisseur au MVP. Ce sont des données gérées par l'Administrateur/Dispatcher. Cela évite de complexifier l'authentification et l'UX dès le départ, alors que rien ne prouve que le client final en a besoin immédiatement.

## 5. Périmètre du projet

### 5.1 MVP (priorité absolue : ce que l'équipe doit livrer en premier)

- Authentification (Admin, Dispatcher, Livreur).
- CRUD Clients (fiche simple : nom, téléphone, adresse(s)).
- CRUD Fournisseurs (fiche simple : nom, téléphone, adresse, produits en texte libre).
- CRUD Livreurs (fiche + statut + véhicule).
- Création et suivi de commandes avec workflow de statuts (voir §7.5).
- Affectation manuelle d'un livreur à une commande.
- Application mobile livreur : liste des commandes affectées, acceptation, mise à jour du statut, envoi de position GPS.
- Tableau de bord admin avec carte affichant la position des livreurs et liste des commandes en cours.
- Notifications push basiques (nouvelle commande affectée, changement de statut).

### 5.2 Version 2

- Gestion des paiements (montant marchandise / frais de livraison / qui encaisse quoi : cf. §7.7).
- Preuve de livraison (photo ou code de confirmation).
- Historique et statistiques (livraisons/jour, chiffre d'affaires, performance livreur).
- Gestion multi-adresses client, gestion de zones de livraison.
- Rapports exportables (PDF/Excel).

### 5.3 Version 3 (exploratoire, non prioritaire)

- Affectation automatique du livreur le plus pertinent (distance, charge de travail).
- Estimation du temps d'arrivée, optimisation d'itinéraire.
- Chatbot / prise de commande automatisée depuis Facebook (traitement du langage naturel).
- Interface client et interface fournisseur dédiées.

## 6. Besoins fonctionnels détaillés

### 6.1 Authentification & rôles
- Connexion par téléphone + mot de passe (ou email + mot de passe pour l'admin).
- Jetons JWT avec access token courte durée + refresh token.
- Rôles : `admin`, `dispatcher`, `livreur` (MVP) ; `comptable`, `superviseur` (V3).

### 6.2 Gestion des clients
- Créer/modifier/rechercher un client (nom, téléphone, adresse(s), coordonnées GPS optionnelles).
- Historique des commandes du client, consultable par l'admin.

### 6.3 Gestion des fournisseurs
- Fiche fournisseur : nom, téléphone, adresse, position GPS, liste de produits en texte libre (pas de gestion de stock, le stock reste chez le fournisseur).
- Recherche rapide d'un fournisseur lors de la création d'une commande.

### 6.4 Gestion des livreurs
- Fiche livreur : identité, téléphone, photo, type de véhicule, immatriculation.
- Statuts : `disponible`, `en_livraison`, `chez_fournisseur`, `hors_ligne`, `désactivé`.
- Historique des livraisons effectuées par livreur.

### 6.5 Gestion des commandes : workflow des statuts

```
nouvelle → confirmée → livreur_affecté → en_route_fournisseur →
marchandise_récupérée → en_route_client → livrée → terminée
```

États d'exception, disponibles à tout moment avant `terminée` :
`annulée`, `échec_livraison` (avec sous-motif : client absent / marchandise indisponible / autre).

Une commande contient au minimum :
- Client (existant ou créé à la volée).
- Fournisseur.
- Description sommaire de la marchandise + quantité (texte libre au MVP, pas de catalogue produit structuré).
- Adresse et position GPS de livraison.
- Frais de livraison.
- Livreur affecté.
- Statut courant + horodatage de chaque changement de statut (audit trail minimal).

### 6.6 Suivi GPS des livreurs
- L'application livreur envoie sa position à intervalle régulier (ex. toutes les 30-60 secondes) **uniquement lorsqu'il est en service** (statut ≠ hors ligne).
- En cas de perte de connexion, la position est mise en cache localement sur le téléphone puis synchronisée dès que la connexion revient.
- Le dashboard admin affiche la dernière position connue de chaque livreur sur une carte, avec l'horodatage de la dernière mise à jour (transparence : on n'affiche jamais une position comme "temps réel" si elle a plus de X minutes).

### 6.7 Paiements : hypothèse à valider avec le client (voir §9)
Hypothèse retenue pour le MVP : **Modèle C** : le client paie la structure (marchandise + frais de livraison), la structure reverse ensuite le montant dû au fournisseur. C'est le modèle le plus simple à tracer et le plus cohérent avec le rôle d'intermédiaire logistique de la structure. Le module de paiement complet (Mobile Money, reversements) est repoussé en V2 ; au MVP, on se contente d'enregistrer le montant attendu et un statut "payé / non payé" par commande.

### 6.8 Notifications
- Notification push au livreur : nouvelle commande affectée.
- Notification push à l'admin/dispatcher : commande livrée, échec de livraison, livreur hors ligne prolongé.
- Canal technique : Firebase Cloud Messaging (voir §10).

### 6.9 Dashboard & statistiques (MVP minimal, enrichi en V2)
- Nombre de commandes du jour, livrées, en cours.
- Carte des livreurs actifs.
- Liste des commandes en cours avec statut.
- (V2) Chiffre d'affaires, revenu par livreur, temps moyen de livraison, fournisseur le plus sollicité.

## 7. Besoins non fonctionnels

- **Connectivité faible/instable** : l'application livreur doit fonctionner en mode dégradé (mise en cache locale des statuts et positions, synchronisation différée).
- **Sécurité** : mots de passe hashés (bcrypt/argon2), tokens JWT signés, communications en HTTPS, séparation stricte des permissions par rôle côté API (pas seulement côté interface).
- **Performance** : le dashboard doit rester utilisable avec quelques dizaines de livreurs actifs simultanément et quelques centaines de commandes/jour, pas de contrainte d'échelle massive au MVP.
- **Auditabilité** : chaque changement de statut de commande doit être horodaté et attribué à un utilisateur.
- **Portabilité mobile** : l'application livreur doit fonctionner sur des téléphones Android d'entrée de gamme (contrainte réaliste pour des livreurs à Ouagadougou) ; le support iOS est secondaire.
- **Maintenabilité** : projet porté par 2 développeurs, privilégier une stack simple à maintenir à deux plutôt qu'une stack "idéale" mais lourde à opérer seuls.

## 8. Modèle de données conceptuel (simplifié)

Entités principales et relations clés :

```
Utilisateur (id, nom, téléphone, mot_de_passe_hash, rôle)
   └── 1—1 → Livreur (id, utilisateur_id, véhicule, statut, dernière_position)

Client (id, nom, téléphone)
   └── 1—N → Adresse (id, client_id, libellé, gps_lat, gps_lng)

Fournisseur (id, nom, téléphone, adresse, gps_lat, gps_lng)
   └── 1—N → ProduitFournisseur (id, fournisseur_id, libellé) [texte libre au MVP]

Commande (id, client_id, fournisseur_id, livreur_id, description_marchandise,
          adresse_livraison_id, frais_livraison, montant_marchandise,
          statut, statut_paiement, créée_le, mise_à_jour_le)

HistoriqueStatutCommande (id, commande_id, statut, horodatage, utilisateur_id)

PositionLivreur (id, livreur_id, gps_lat, gps_lng, horodatage)
```

> Ce MCD simplifié est volontairement minimal pour le MVP. Il devra être affiné avec le client une fois les hypothèses du §9 validées (notamment le modèle de paiement, qui impacte directement le schéma de `Commande`).

## 9. Hypothèses posées, à valider avec le client avant/ pendant le développement

Voir le fichier séparé [`questions-client.md`](./questions-client.md) pour la liste complète des questions organisées par thème (reprises et complétées de la discussion avec GPT). Les hypothèses ci-dessous sont celles retenues **par défaut** pour pouvoir démarrer le développement du MVP sans attendre les réponses :

1. Le modèle de paiement retenu est le **Modèle C** (client paie la structure, qui reverse au fournisseur) : §6.7.
2. Les livreurs sont supposés indépendants (pas de gestion de paie salariale au MVP).
3. Un client n'a pas de compte/app dédiée au MVP, il continue d'appeler.
4. Un fournisseur ne gère pas de catalogue produit structuré au MVP, texte libre uniquement.
5. La position GPS n'est envoyée que lorsque le livreur est en service (pas de tracking permanent hors service, pour des raisons de respect de la vie privée du livreur et de consommation batterie).
6. Une seule structure (UNIQUE Livraison Expresse) utilise le logiciel, pas de multi-tenant prévu.

## 10. Architecture technique & stack recommandé

### 10.1 Vue d'ensemble

```
        ┌─────────────────────────┐        ┌──────────────────────┐
        │   Admin Dashboard (web) │        │  App mobile Livreur  │
        │   Next.js + Tailwind    │        │      Flutter         │
        └────────────┬────────────┘        └───────────┬──────────┘
                      │            REST API + WebSocket │
                      └───────────────┬──────────────────┘
                                       ▼
                          ┌───────────────────────┐
                          │        Backend        │
                          │  Node.js + TypeScript │
                          │      (NestJS)         │
                          │  Auth · Commandes ·   │
                          │  Livreurs · GPS ·      │
                          │  Notifications         │
                          └───────────┬───────────┘
                                      │
                              ┌───────┴────────┐
                              ▼                ▼
                        PostgreSQL      Firebase Cloud
                        (Prisma ORM)    Messaging (push)
```

### 10.2 Choix et justification

| Brique | Choix | Pourquoi |
|---|---|---|
| Backend | **Node.js + TypeScript (NestJS)** | Un seul langage (TypeScript) pour backend + dashboard admin → moins de contexte à switcher pour 2 développeurs. NestJS impose une structure claire (modules/services/contrôleurs), utile pour garder le code propre à deux. |
| Base de données | **PostgreSQL** | Relationnel, robuste, gratuit, gère bien les statuts/historiques/relations décrites au §8. Extension **PostGIS** activable plus tard si les requêtes géographiques deviennent complexes (V2/V3) ; au MVP, coordonnées lat/lng en colonnes simples suffisent. |
| ORM | **Prisma** | Migrations simples, typage TypeScript de bout en bout, bonne courbe d'apprentissage à deux. |
| Temps réel (position GPS, statuts) | **WebSocket via Socket.IO**, avec repli sur polling REST toutes les 30-60s si la connexion est instable | Évite de sur-promettre un "vrai temps réel" non tenable sur des réseaux faibles. |
| Dashboard admin | **Next.js (React) + TailwindCSS** | Écosystème riche, bon support cartographique, déploiement simple (Vercel). |
| Cartographie | **Leaflet + OpenStreetMap** | Gratuit, pas de clé API payante à gérer dès le MVP ; migration possible vers Mapbox/Google Maps en V2 si besoin de fonds de carte plus riches. |
| Application livreur | **Flutter** | Un seul codebase pour Android (prioritaire) et iOS (secondaire), bon support GPS/notifications/mode offline, adapté aux téléphones d'entrée de gamme. |
| Notifications push | **Firebase Cloud Messaging (FCM)** | Gratuit, standard, s'intègre bien à Flutter et à un backend Node.js. |
| Authentification | **JWT (access + refresh token)** | Standard, simple à implémenter côté API comme côté mobile/web. |
| Hébergement (MVP) | Backend + PostgreSQL sur **Railway** ou **Render** ; dashboard sur **Vercel** ; app livreur distribuée en APK direct ou via Play Store en bêta fermée | Budget réduit, mise en place rapide, adapté à un projet étudiant/débutant en production. |
| Gestion de version | **Git + GitHub**, convention de commits (`feat:`, `fix:`, `docs:`...), une branche `main` protégée + branches de fonctionnalités | Nécessaire même à deux, pour éviter les conflits et garder un historique lisible. |


## 11. Feuille de route indicative (sprints de 2 semaines)

| Sprint | Contenu |
|---|---|
| Sprint 0 | Mise en place du repo, de l'environnement (BDD, backend, dashboard, app mobile), CI basique, validation des hypothèses du §9 avec le client. |
| Sprint 1 | Authentification + CRUD Clients/Fournisseurs/Livreurs. |
| Sprint 2 | Création de commande + workflow de statuts + affectation manuelle. |
| Sprint 3 | Application mobile livreur : réception commande, changement de statut, envoi position GPS. |
| Sprint 4 | Dashboard admin : carte des livreurs, liste des commandes en cours, notifications push. |
| Sprint 5 | Tests, correctifs, démonstration MVP au client, recueil de retours. |
| Sprints suivants | Démarrage V2 (paiements, preuve de livraison, statistiques) selon retours du client. |

## 12. Répartition indicative des rôles (2 développeurs)

Voir le détail dans [`repartition-taches.md`](./repartition-taches.md). Proposition de base : **Personne A** prend en charge le backend (API, base de données, logique métier, temps réel) ; **Personne B** prend en charge les deux interfaces (dashboard admin + app mobile livreur) et l'intégration avec l'API. Les deux se coordonnent sur le contrat d'API (définir les endpoints ensemble avant de coder chacun de son côté).

## 13. Livrables attendus

- Code source du backend, du dashboard admin et de l'application mobile, dans le présent repository.
- Documentation d'installation et de déploiement (README par module).
- MVP fonctionnel démontrable au client final.
- Ce cahier des charges, mis à jour au fil des retours du client.
