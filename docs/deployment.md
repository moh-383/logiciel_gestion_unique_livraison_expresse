# Déploiement du MVP de test

## Architecture retenue

- API : Render Web Service Node.js, Frankfurt. NestJS reste un service HTTP long vivant; Socket.IO utilise le même port public.
- Dashboard : Render Web Service Node.js/Next.js, Frankfurt, avec son URL API publique injectée au build.
- Base : Neon PostgreSQL, région AWS Frankfurt (`eu-central-1`), accessible à l’API avec TLS via une URL de connexion pooled.
- Mobile : APK Flutter Android compilé avec `API_BASE_URL=https://<API_RENDER>/api`.

Ce choix évite d’utiliser SQLite ou un disque éphémère pour les données. Au 4 octobre 2026, Neon indique 100 projets gratuits et 1 Go de stockage par projet; les limites d’usage du plan restent applicables. Render offre le plan Free sans frais, mais endort les services après 15 minutes sans trafic (réveil pouvant prendre environ une minute). Ses bases Postgres gratuites expirent au bout de 30 jours, donc elles ne sont pas utilisées ici. Ces niveaux conviennent à une courte campagne de test, pas à une disponibilité garantie.

## Création des ressources

1. Publier le dépôt GitHub `moh-383/logiciel_gestion_unique_livraison_expresse` après vérification des secrets et de l’historique.
2. Créer un projet Neon en région Frankfurt, puis copier l’URL pooled PostgreSQL TLS du projet. Ne pas coller cette URL dans Git.
3. Dans Render, créer un Blueprint depuis `render.yaml` et connecter le dépôt GitHub. Choisir le plan Free pour les deux services.
4. Lors de la synchronisation du Blueprint, renseigner les variables marquées `sync: false` dans le tableau de bord sécurisé Render :
   - API : `DATABASE_URL` (URL Neon pooled), `CORS_ORIGINS` (origine HTTPS exacte du dashboard), `FCM_SERVICE_ACCOUNT_JSON` (contenu du compte de service Firebase Admin du projet `unique-livraison-expresse`) et les trois mots de passe de démo.
   - Dashboard : `NEXT_PUBLIC_API_URL=https://<API_RENDER>/api`.
   Les secrets JWT sont générés par Render. N’enregistrer aucune de ces valeurs dans le dépôt, dans GitHub Actions ou dans des logs.
5. Render démarre l’API en appliquant les migrations puis en exécutant le seed explicitement autorisé pour cet environnement de test. Le seed est idempotent pour les données métier; il réapplique les mots de passe des comptes démo à chaque redémarrage. Utiliser une base de test dédiée sans données réelles.
6. Après déploiement, vérifier `https://<API_RENDER>/api/health`, `https://<API_RENDER>/api/docs`, le dashboard HTTPS et les connexions Socket.IO (`wss`).

Les services gratuits Render n’offrent ni shell ni tâches ponctuelles; le seed automatique ci-dessus évite d’avoir à ouvrir un shell distant. Désactiver l’environnement ou choisir des instances payantes si le délai de réveil ne convient pas. Aucun déploiement n’est effectué par ce fichier seul : la connexion GitHub à Render et la création du projet Neon requièrent une session utilisateur.

## Variables et sécurité

Les fichiers `.env`, les credentials Firebase Admin et les secrets restent exclus de Git. `google-services.json` et `lib/firebase_options.dart` sont la configuration cliente Firebase Android nécessaire à la compilation; ils ne contiennent pas de clé privée de compte de service. Le service account JSON est transmis uniquement au champ secret Render `FCM_SERVICE_ACCOUNT_JSON`.

La valeur `CORS_ORIGINS` doit contenir l’origine exacte du dashboard, par exemple `https://unique-livraison-dashboard-test.onrender.com`, sans slash final. Elle protège aussi la configuration Socket.IO. Les clients mobiles n’envoient pas d’en-tête `Origin` de navigateur; ils utilisent l’API HTTPS et l’authentification Bearer.

## Redéploiement et APK distant

Render redéploie automatiquement les deux services après une mise à jour de la branche connectée. Après tout changement d’URL d’API, mettre à jour `NEXT_PUBLIC_API_URL` dans Render et reconstruire le dashboard. Compiler ensuite le mobile depuis `mobile-livreur/` :

```powershell
flutter pub get
flutter build apk --debug --dart-define=API_BASE_URL=https://<API_RENDER>/api
```

Le fichier de test sera `build/app/outputs/flutter-apk/app-debug.apk`. Vérifier l’empreinte et la date de génération; ne pas envoyer un APK local ou ancien. Une version release signée nécessite une clé de signature privée fournie et conservée hors du dépôt.

## État initial / blocages

Le Blueprint est préparé, mais les services ne sont pas encore créés et aucune URL distante n’existe. L’accès aux comptes GitHub, Neon et Render ainsi que la saisie des secrets devront être réalisés dans leurs consoles si la session n’est pas déjà autorisée. Le build Flutter local attend la libération du verrou `C:\Users\USER\source\flutter\bin\cache\flutter.bat.lock`; le processus Dart existant doit être identifié et arrêté proprement avant de générer l’APK. Le test sur téléphone, la réception FCM et le parcours end-to-end distant restent à effectuer après création des URLs.
