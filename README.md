# UNIQUE Livraison Expresse

Plateforme MVP de dispatch avec API NestJS/Prisma/PostgreSQL, dashboard Next.js/Leaflet et application Android Flutter livreur. Le dashboard gère clients, fournisseurs, livreurs et commandes; le mobile consulte et fait progresser les commandes affectées, avec envoi GPS en premier plan.

## Démarrage

Suivre [`docs/setup.md`](docs/setup.md) pour PostgreSQL, API, seed local, dashboard et Flutter. Les secrets d’accès sont fournis par l’environnement local et ne sont pas versionnés.

## Structure

```text
backend/          API NestJS, Prisma, REST et Socket.IO
admin-dashboard/  Console Next.js et carte Leaflet/OpenStreetMap
mobile-livreur/   Client Flutter Android
docs/             Contrat API, installation, marque et état vérifié
```

## Documentation

- [État du projet et vérifications](docs/project-status.md)
- [Installation et parcours de démonstration](docs/setup.md)
- [Contrat API](docs/api.md)
- [Identité visuelle](docs/brand-guidelines.md)
- [Design system](docs/design-system.md)
- [Décisions techniques](docs/decisions.md)
- [Limites connues](docs/known-issues.md)
- [Journal de développement](docs/development-log.md)

Les notifications FCM et la synchronisation des actions hors connexion sont implémentées. L’envoi push nécessite un compte de service Firebase côté API; le parcours complet doit encore être validé sur un appareil Android. Voir les limites dans `docs/known-issues.md`.
