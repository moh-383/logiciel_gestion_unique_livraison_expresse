# Backend : UNIQUE Livraison Expresse

API du système : authentification, gestion des clients/fournisseurs/livreurs, commandes, suivi GPS, notifications.

## Stack prévue
- Node.js + TypeScript
- NestJS
- PostgreSQL + Prisma ORM
- Socket.IO pour le temps réel (positions, statuts)
- JWT pour l'authentification
- Firebase Admin SDK pour l'envoi de notifications push

## Mise en place (à faire au Sprint 0)

```bash
# Depuis ce dossier
npx @nestjs/cli new .        # ou : npm init -g @nestjs/cli puis nest new .
npm install @prisma/client
npm install -D prisma
npx prisma init
```

Créer un fichier `.env` (non versionné, voir `.env.example`) avec au minimum :

```
DATABASE_URL="postgresql://user:password@localhost:5432/unique_livraison"
JWT_SECRET="à générer"
JWT_REFRESH_SECRET="à générer"
FIREBASE_SERVICE_ACCOUNT_PATH="./firebase-service-account.json"
```

## Modules prévus (voir `docs/cahier-des-charges.md` §8 et §10)
- `auth` : authentification, rôles, guards
- `clients`
- `fournisseurs`
- `livreurs`
- `commandes`
- `gps` : réception et diffusion des positions
- `notifications`

## Scripts (une fois le projet NestJS initialisé)

```bash
npm run start:dev     # démarrage en mode développement
npx prisma migrate dev  # appliquer les migrations
npx prisma studio      # explorer la base de données
```
