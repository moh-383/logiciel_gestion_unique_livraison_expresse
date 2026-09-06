# Backend : UNIQUE Livraison Expresse

API du système : authentification, gestion des clients/fournisseurs/livreurs, commandes, suivi GPS, notifications.

## Stack
- Node.js + TypeScript (CommonJS : volontairement, pas d'ESM, pour rester simple et compatible avec toute la documentation/tutos NestJS existants)
- NestJS 12
- PostgreSQL + Prisma ORM (v7.10.0, épinglée volontairement, évitez de faire un `npm update` vers la 8.x qui est encore en release candidate au moment de l'écriture)
- Socket.IO pour le temps réel (positions GPS, cf. module `gps`)
- JWT pour l'authentification (access token 15 min + refresh token 7 jours)

## ⚠️ Étapes obligatoires après avoir cloné le repo

Le code est déjà écrit (modules `auth`, `clients`, `fournisseurs`, `livreurs`, `commandes`, `gps`, `notifications`), mais **le client Prisma n'est pas encore généré**, c'est normal, ça n'a pas pu être fait dans l'environnement où ce repo a été préparé (pas d'accès réseau à `binaries.prisma.sh` depuis ce sandbox). Tant que ce n'est pas fait, `npm run build` affichera des erreurs TypeScript du type "Property 'client' does not exist on type 'PrismaService'"  c'est normal, ça disparaît après l'étape 4 ci-dessous.

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Créer une base PostgreSQL locale (ou utiliser un service comme Railway/Render), puis copier la config :
   ```bash
   cp .env.example .env
   ```
   Éditer `.env` et renseigner `DATABASE_URL` avec vos vrais identifiants, et générer de vrais secrets pour `JWT_SECRET` / `JWT_REFRESH_SECRET` (par exemple avec `openssl rand -base64 48`).
3. Générer le client Prisma à partir du schéma (`prisma/schema.prisma`) :
   ```bash
   npx prisma generate
   ```
4. Appliquer le schéma à la base de données (crée les tables) :
   ```bash
   npx prisma migrate dev --name init
   ```
5. Démarrer le serveur en mode développement :
   ```bash
   npm run start:dev
   ```
   L'API est alors disponible sur `http://localhost:3000/api`.

## Modules déjà en place

| Module | Contenu |
|---|---|
| `prisma/` | `PrismaService` global, connecté au démarrage de l'app |
| `auth/` | Login JWT (`POST /api/auth/login`), refresh (`POST /api/auth/refresh`), stratégie Passport, guards `JwtAuthGuard`/`RolesGuard`, décorateur `@Roles(...)` |
| `clients/` | CRUD clients + ajout d'adresses |
| `fournisseurs/` | CRUD fournisseurs + ajout de produits (texte libre, pas de stock : cf. cahier des charges §6.3) |
| `livreurs/` | Création livreur (crée Utilisateur + Livreur ensemble), CRUD, changement de statut, historique de positions |
| `commandes/` | Création, affectation de livreur, changement de statut avec historique horodaté (`HistoriqueStatutCommande`) |
| `gps/` | `GpsGateway` (WebSocket, événement `position:update` → broadcast `position:livreur` à la room `dashboard`) + fallback REST `POST /api/gps/position` pour connexion instable |
| `notifications/` | Squelette de service (log uniquement) — à brancher sur Firebase Cloud Messaging en V2, cf. commentaires dans `notifications.service.ts` |

Le contrat des rôles (`Role.ADMIN`, `Role.DISPATCHER`, `Role.LIVREUR`) et le workflow des statuts de commande suivent exactement le §6 et le §8 du `docs/cahier-des-charges.md` à la racine du repo, à consulter en cas de doute sur une règle métier.

## Premier compte admin

Il n'y a pas encore de script de seed. Le moyen le plus simple de créer le tout premier compte admin est de passer directement par `prisma studio` après la migration :

```bash
npx prisma studio
```

Créez une ligne dans la table `utilisateurs` avec `role = ADMIN` et un `motDePasse` déjà haché en bcrypt (vous pouvez générer ce hash rapidement avec un petit script Node : `require('bcrypt').hashSync('votre_mot_de_passe', 10)`). Un vrai endpoint de création du premier admin (ou une commande CLI) est une bonne première tâche à ajouter.

## Prochaines étapes suggérées (non faites)
- Tests unitaires (le dossier `test/` généré par Nest est encore le squelette par défaut).
- Script de seed (`prisma/seed.ts`) pour créer un admin + quelques données de démo.
- Intégration réelle de Firebase Cloud Messaging dans `notifications.service.ts`.
- Documentation OpenAPI/Swagger du contrat d'API (utile pour que Personne B avance en parallèle sur le dashboard/l'app mobile sans attendre).
