# Admin Dashboard : UNIQUE Livraison Expresse

Interface web d'administration : gestion des clients, fournisseurs, livreurs, commandes, carte de suivi GPS, statistiques.

## Stack prévue
- Next.js (React) + TypeScript
- TailwindCSS
- Leaflet + OpenStreetMap (carte des livreurs)
- Socket.IO client (mise à jour temps réel des positions/statuts)

## Mise en place (à faire au Sprint 0)

```bash
# Depuis ce dossier
npx create-next-app@latest . --typescript --tailwind
npm install leaflet react-leaflet socket.io-client axios
```

Créer un fichier `.env.local` (non versionné) avec au minimum :

```
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Écrans prévus (MVP : voir `docs/cahier-des-charges.md` §6)
- Connexion
- Liste / fiche Clients
- Liste / fiche Fournisseurs
- Liste / fiche Livreurs (avec statut)
- Liste des commandes + création + suivi de statut
- Carte des livreurs en service
- Tableau de bord (compteurs simples : commandes du jour, livrées, en cours)
