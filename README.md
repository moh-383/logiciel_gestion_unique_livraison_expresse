# UNIQUE Livraison Expresse : Logiciel de gestion des livraisons

Plateforme de gestion et de pilotage des livraisons permettant de centraliser les commandes, les clients, les fournisseurs et les livreurs, avec affectation, suivi GPS et notifications, en remplacement de la coordination manuelle par téléphone et groupes WhatsApp.

## 📄 Documentation

Toute la spécification du projet se trouve dans `docs/` :

- [`docs/cahier-des-charges.md`](docs/cahier-des-charges.md) : spécification fonctionnelle et technique complète.
- [`docs/questions-client.md`](docs/questions-client.md) : questions à valider avec le client, par thème.
- [`docs/repartition-taches.md`](docs/repartition-taches.md) : répartition du travail entre les deux développeurs et checklist de démarrage.

**À lire en premier avant d'écrire la moindre ligne de code.**

## 🏗️ Structure du repo

```
UNIQUE-Livraison-Expresse/
├── docs/                  # Cahier des charges, questions, répartition des tâches
├── backend/               # API : Node.js / NestJS + PostgreSQL (Prisma)
├── admin-dashboard/       # Tableau de bord web : Next.js + Tailwind + Leaflet
├── mobile-livreur/        # Application mobile livreur : Flutter
└── .github/workflows/     # Intégration continue (à compléter)
```

## 🧱 Stack technique (résumé : détails et justification dans le cahier des charges §10)

| Brique | Techno |
|---|---|
| Backend | Node.js, TypeScript, NestJS |
| Base de données | PostgreSQL + Prisma ORM |
| Temps réel | Socket.IO (WebSocket) |
| Dashboard admin | Next.js, React, TailwindCSS, Leaflet/OpenStreetMap |
| App mobile livreur | Flutter |
| Notifications | Firebase Cloud Messaging |
| Authentification | JWT (access + refresh token) |

## 🚀 Démarrage rapide

Chaque module a son propre README avec les instructions d'installation :

- [`backend/README.md`](backend/README.md)
- [`admin-dashboard/README.md`](admin-dashboard/README.md)
- [`mobile-livreur/README.md`](mobile-livreur/README.md)

## 👥 Équipe

Projet développé à deux : Personne A (backend) et Personne B (interfaces). Voir [`docs/repartition-taches.md`](docs/repartition-taches.md) pour le détail.

## 📌 État du projet

En phase de cadrage , le MVP est défini dans le cahier des charges (§5.1). Développement pas encore démarré.
