# Console UNIQUE Livraison Expresse

Dashboard Next.js/TypeScript avec identité visuelle UNIQUE, connexion admin/dispatcher, compteurs API, carte Leaflet/OpenStreetMap, clients, fournisseurs, livreurs, commandes et flux Socket.IO avec polling GPS de secours.

## Développement

```sh
npm ci
npm run dev
```

API par défaut : `http://localhost:3000/api`. Pour la remplacer, créer `.env.local` avec `NEXT_PUBLIC_API_URL=http://localhost:3000/api`. Ajouter l’origine web (généralement `http://localhost:3001`) à `CORS_ORIGINS` de l’API.

## Fonctionnalités

- Clients : créer, consulter, éditer, supprimer; adresses/coordonnées à la création; recherche locale.
- Fournisseurs : création, fiche, édition, suppression, recherche.
- Livreurs : consulter/statut/disponibilité; création et modification véhicule réservées à l’admin conformément aux rôles API.
- Commandes : liste filtrée par statut, création depuis les référentiels, détail/historique, confirmation, affectation d’un livreur disponible, transitions API et motif d’échec.
- Compteurs : commandes du jour, en cours, livrées et livreurs actifs.
- Carte : points GPS temps réel Socket.IO, repli REST 30 s, âge explicite de chaque dernière position.

Les transitions sont toujours validées par NestJS. Voir [`../docs/api.md`](../docs/api.md) et [`../docs/setup.md`](../docs/setup.md). Le build de production se vérifie avec `npm run build`.
