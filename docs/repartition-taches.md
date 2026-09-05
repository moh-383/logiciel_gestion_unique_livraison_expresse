# Répartition des tâches : Personne A & Personne B

Proposition de base, à ajuster selon les affinités réelles de chacun. Le principe : chacun est propriétaire d'un périmètre clair, mais le contrat d'API (routes, formats de données) est défini **ensemble** avant de coder séparément, pour éviter les blocages d'intégration en fin de sprint.

## Personne A : Backend & données

- Mise en place du projet NestJS + PostgreSQL + Prisma.
- Modèle de données (migrations Prisma à partir du MCD du §8 du cahier des charges).
- Authentification (JWT access/refresh, gestion des rôles).
- Endpoints CRUD : Clients, Fournisseurs, Livreurs.
- Logique métier : workflow des statuts de commande, affectation de livreur.
- WebSocket / endpoint de réception des positions GPS.
- Intégration Firebase Cloud Messaging côté serveur (envoi des notifications).
- Déploiement backend + base de données (Railway/Render).

## Personne B : Interfaces (dashboard admin + app livreur)

- Dashboard admin (Next.js + Tailwind) : écrans Clients, Fournisseurs, Livreurs, Commandes.
- Intégration carte (Leaflet + OSM) : affichage des livreurs sur la carte, dernière position connue.
- Application mobile livreur (Flutter) : écran liste des commandes, acceptation, changement de statut, envoi périodique de la position GPS, réception des notifications push.
- Gestion du mode offline côté app livreur (mise en cache locale + synchronisation).
- Déploiement dashboard (Vercel) + distribution de l'app livreur (APK / Play Store bêta).

## Points de synchronisation communs (les deux)

- Définition du contrat d'API avant chaque sprint (routes, payloads, codes d'erreur), idéalement figé dans un fichier OpenAPI/Swagger généré depuis NestJS.
- Revue de code croisée sur les pull requests avant fusion dans `main`.
- Tests manuels croisés du MVP avant démonstration au client.
- Suivi des hypothèses/questions du fichier `questions-client.md` au fur et à mesure des échanges avec le client.
