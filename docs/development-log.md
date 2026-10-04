# Journal de développement

## 2026-09-30 — Audit et stabilisation

- Sécurisation JWT/configuration, contrôle rôle/livreur pour GPS et commandes, transitions métier, validation des coordonnées, CORS et imports Passport par module.
- Création du premier squelette dashboard et carte Leaflet/Socket.IO avec âge des positions.
- Backend compilé/testé, API démarrée et routes protégées vérifiées. PostgreSQL local était accessible.

## 2026-10-01 — MVP fonctionnel et marque

### Réalisation

- Dashboard avec login admin/dispatcher, rotation refresh, logout révocable, listes/recherche et formulaires clients (avec adresse/GPS), fournisseurs, livreurs et commandes. Fiches, état disponibilité, édition/suppression selon routes, filtres de statut, affectation, transitions, motif d’échec, frais et historique.
- Carte intégrée à la vue principale, événements Socket.IO et repli REST 30 s; âge de dernière position visible.
- Flutter Android initialisé. Connexion réservée au rôle LIVREUR, token sécurisé, commandes/detail, étapes métier API, sélection disponible/hors ligne, GPS 30 s en premier plan, actualisation 30 s pour les affectations.
- Ajout de quantité à la création API, d’un enum de motif d’échec à la commande et d’une migration; rotation atomique single-use des refresh tokens et endpoint logout.
- Ajout d’un seed local qui requiert les mots de passe via variables d’environnement et bloque le mode production. Il n’a pas été exécuté.
- Extraction raster du logo depuis l’affiche de marque fournie; palette et design system documentés et intégrés au web/Android.
- Documentation API/setup/état/limites/décisions revue. Aucune configuration Firebase n’était disponible; aucun push n’est revendiqué.

### Vérifications observées

- `npx prisma format` et `npx prisma generate` réussis.
- `npx prisma migrate deploy` : migration de quantité, motif et refresh hash appliquée à PostgreSQL local `unique_livraison`.
- `npx prisma migrate deploy` a appliqué la migration locale. Seed exécuté avec mots de passe de développement fournis par variables d’environnement.
- Premier démarrage HTTP a révélé que `PassportModule` dans `AuthModule` devait être enregistré (`PassportModule.register({})`); correction faite et API a démarré avec toutes les routes mappées.
- Parcours HTTP/API et base validé : login admin, client+adresse, fournisseur, liste livreurs, commande, confirmation, affectation, login livreur, commandes assignées, quatre étapes livreur, GPS, `TERMINEE`, historique. Rotation de refresh, refus de réutilisation de l’ancien token et logout invalidant le nouveau refresh vérifiés.
- L’API retourne 400 à l’échec sans motif, stocke `AUTRE` avec transition valide, et le point GPS est visible par l’endpoint admin.
- `npm run build` backend et `npm test` : 3 tests réussis après les corrections. `npm run build` Next.js réussi.
- Flutter `analyze` sans problème et `flutter test` : test de marque passé. La compilation APK a compilé puis échoué à l’étape de packaging faute d’espace disque; les 1,85 Go d’artefacts partiels générés ont été supprimés. Pas de validation téléphone/émulateur.

### Limites restantes

- FCM attend un projet/config Firebase et credentials serveur; polling mobile 30 s sert de solution de démonstration.
- Synchronisation des changements offline non implémentée; erreurs et actualisation restent visibles.
- Pas de GPS background. Pas de validation physique sur téléphone/émulateur dans ce cycle; APK non produit faute d’espace disque au packaging.
- Swagger/OpenAPI non configuré; le contrat API dans `api.md` est tenu manuellement.
- Logo extrait d’un poster JPEG, pas le master vectoriel.
