# API UNIQUE Livraison Expresse

API NestJS 12, Prisma/PostgreSQL, JWT et Socket.IO. Les migrations sont versionnées sous `prisma/migrations`; le contrat des routes consommées est dans [`../docs/api.md`](../docs/api.md).

## Installation

Copier `.env.example` en `.env`, puis renseigner `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT` et `CORS_ORIGINS`. Utiliser des secrets aléatoires distincts. Puis :

```sh
npm ci
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

L’API utilise le préfixe `http://localhost:3000/api` par défaut. Test/build : `npm test` et `npm run build`.

## Seed développement

Le script `npm run seed` exige `DEMO_ADMIN_PASSWORD`, `DEMO_DISPATCHER_PASSWORD` et `DEMO_DRIVER_PASSWORD`, refuse `NODE_ENV=production`, et crée les comptes téléphones `+22670000001`, `+22670000002`, `+22670000003`. Les mots de passe sont choisis localement et ne sont jamais versionnés. Le seed de données ne remplit les tables client/fournisseur/commande que lorsqu’elles sont vides.

## Sécurité / périmètre

Les refresh tokens sont hashés/rotatifs à usage unique; `POST /api/auth/logout` les révoque. GPS prend l’identité du JWT, vérifie les bornes et refuse livreur hors ligne/désactivé. Le statut et les transitions de commande sont contrôlés côté API. Le motif d’échec est enum et obligatoire si ECHEC_LIVRAISON.

FCM est activé lorsque `FCM_SERVICE_ACCOUNT_PATH` pointe vers un JSON de compte de service Firebase Admin gardé hors du dépôt, ou lorsque `FCM_SERVICE_ACCOUNT_JSON` contient ce JSON. Sans credential, l’API démarre sans push. Le mobile utilise `google-services.json` et `lib/firebase_options.dart` générés par FlutterFire; l’inscription du jeton est `POST /api/auth/device-token`.

Swagger UI: `http://localhost:3000/api/docs`; document OpenAPI JSON: `http://localhost:3000/api/docs-json`. Le schéma inclut le bearer JWT et les principales ressources.
