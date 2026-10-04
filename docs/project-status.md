# État du projet UNIQUE Livraison Expresse

Mis à jour : 2026-10-04. « Implémenté » signifie présent dans le code; « Vérifié » signifie que la commande indiquée a réussi. Un build ne prouve pas un parcours physique.

## Backend et base

| Domaine | État | Preuve / limite |
| --- | --- | --- |
| Auth JWT, rôles, bcrypt, révocation/rotation refresh single-use | VÉRIFIÉ | Nest build et suite backend; hash SHA-256 au stockage, rotation compare-and-swap. |
| Clients, adresses, fournisseurs, livreurs, commandes REST | VÉRIFIÉ | Nest compile; contrat dans `api.md`; appel en base réel du flux pas encore exécuté de bout en bout. |
| Transitions nominales, contrôle d’appartenance, historique | VÉRIFIÉ | 3 tests backend passent; scénario HTTP/DB complet de confirmation à TERMINEE effectué. |
| Motif d’échec requis | VÉRIFIÉ | DTO/service et enum Prisma; migration appliquée. Parcours complet d’échec non simulé. |
| Validation des coordonnées GPS | VÉRIFIÉ | DTO et contrôles service; mêmes tests/backend build. |
| REST GPS, refus hors ligne, Socket.IO | VÉRIFIÉ | POST position JWT enregistré et GET dernière position contient le point pendant le scénario intégré; socket map implémenté. GPS appareil/permissions non testés. |
| PostgreSQL et migrations | VÉRIFIÉ | Les migrations de workflow et `20261001120000_fcm_device_token` ont été appliquées sur la base locale `unique_livraison`; client Prisma inclut le champ du jeton FCM. |
| Health check | VÉRIFIÉ | `GET /api/health` renvoie 200 et teste PostgreSQL via `SELECT 1`; Swagger JSON renvoie également 200 en local. |
| Seed de développement | VÉRIFIÉ | Seed exécuté; les trois comptes de démonstration ont des mots de passe aléatoires et leurs connexions API ont été vérifiées. |
| Swagger/OpenAPI | VÉRIFIÉ | Swagger UI `/api/docs` et JSON `/api/docs-json` répondent 200 sur l’API locale. |
| Notifications FCM | IMPLÉMENTÉ, CONFIG LOCALE CHARGÉE, ENVOI NON VALIDÉ DE BOUT EN BOUT | Les options FlutterFire et le JSON de compte de service local ciblent le même projet; Firebase Admin démarre sans erreur après correction du repli vers le fichier. Aucun appareil/jeton actif n’est disponible pour confirmer la réception. |

## Dashboard

| Domaine | État | Preuve / limite |
| --- | --- | --- |
| Connexion admin/dispatcher, refresh, logout | VÉRIFIÉ | Build Next.js, démarrage local et HTTP 200 vérifiés; connexion des deux rôles vérifiée par API. |
| Vue générale, commandes du jour/en cours/livrées, livreurs actifs, commandes récentes | IMPLÉMENTÉ | Compteurs calculés depuis l’API. |
| Carte, Socket.IO, dernière position et âge du point | VÉRIFIÉ | Code Leaflet/Socket.IO et polling 30 s; nécessite serveur vivant et coordonnées pour voir les points. |
| Clients/adresses | VÉRIFIÉ | Build; scénario HTTP/DB créé client/adresse. Liste/recherche/fiche/édition/suppression branchées. |
| Fournisseurs | VÉRIFIÉ | Build; scénario HTTP/DB a créé le fournisseur. CRUD/fiche branchés. |
| Livreurs | VÉRIFIÉ | Build; scénario API a listé et authentifié le livreur. Statut/véhicule/fiche et création admin branchés. |
| Commandes | VÉRIFIÉ | Scénario API/DB : création, confirmation, affectation, cinq étapes, GPS, clôture et historique. Motif d’échec manquant retourne 400; `AUTRE` est stocké. |

## Application Flutter

| Domaine | État | Preuve / limite |
| --- | --- | --- |
| Projet Android, identité et icônes | BUILD ANTÉRIEUR DISPONIBLE | Un APK debug antérieur existe dans `mobile-livreur/build/app/outputs/flutter-apk/app-debug.apk`; sa génération avec la configuration Firebase/API actuelle est bloquée par un verrou Flutter préexistant. Il n’est pas validé comme APK partageable. |
| Connexion livreur, session sécurisée, refresh/logout | IMPLÉMENTÉ | Client Dio et `flutter_secure_storage`; analyse statique. |
| Commandes affectées, détails, workflow séquentiel via API | IMPLÉMENTÉ | Bouton accepter démarre `EN_ROUTE_FOURNISSEUR`; serveur reste l’autorité. Appareil connecté pas encore testé. |
| GPS toutes les 30 s en premier plan et en service | IMPLÉMENTÉ | Geolocator et REST; aucun appareil réel/émulateur avec permission vérifié. |
| FCM | CONFIGURATION CHARGÉE, RÉCEPTION NON TESTÉE | Les options FlutterFire et le compte de service local ciblent `unique-livraison-expresse`; Firebase Admin s’initialise sans erreur. Aucun appareil/jeton actif n’était disponible pour tester la réception. La console Firebase n’a pas été vérifiée. |
| File d’actions offline | IMPLÉMENTÉ | SharedPreferences garde, par utilisateur, les transitions, le statut livreur et la dernière position; synchronisation automatique au premier plan et périodique. Flutter analyse et tests passent; essai de coupure sur appareil impossible sans AVD/appareil. |
| GPS en arrière-plan | NON COMMENCÉ | Le partage s’arrête avec l’app en arrière-plan. |

## Marque et documents

Logo raster extrait de l’affiche, favicon Web/Android, palette rouge/noir/or/blanc et recommandations dans `brand-guidelines.md` et `design-system.md`. Le fichier maître vectoriel n’a pas été fourni; l’extraction porte la limite de résolution/compression de l’affiche.

Documents de travail : `api.md`, `brand-guidelines.md`, `design-system.md`, `setup.md`, `deployment.md`, `development-log.md`, `known-issues.md`, `decisions.md`.

## Déploiement distant

| Domaine | État | Preuve / limite |
| --- | --- | --- |
| Blueprint Render / Neon | PRÉPARÉ, NON DÉPLOYÉ | `render.yaml` décrit l’API et le dashboard Render; `docs/deployment.md` décrit Neon PostgreSQL. Pas de connexion aux consoles ni d’URL publique dans cette session. |
| Secrets / Git | CONTRÔLÉ AVANT PUBLICATION | `.env` et le JSON Firebase Admin sont ignorés; le scan du working tree et de l’historique n’a trouvé aucune clé privée ni token. Configuration cliente Firebase seulement destinée au build mobile. |
| APK API distante | BLOQUÉ | L’URL publique n’existe pas encore et Flutter attend un verrou détenu par un processus Dart ancien. Ne pas utiliser l’APK antérieur. |

## Prochaines étapes

1. Connecter GitHub à Render et créer un projet PostgreSQL Neon; renseigner les secrets demandés dans les consoles.
2. Obtenir les URL HTTPS API/dashboard, mettre à jour CORS et construire l’APK distant.
3. Libérer le processus Flutter/Dart identifié puis vérifier FCM et tout le parcours depuis un téléphone et un réseau extérieur.
