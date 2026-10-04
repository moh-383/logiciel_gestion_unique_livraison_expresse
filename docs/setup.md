# Installation et démonstration locale

## Prérequis

- Node.js 22+ et npm;
- PostgreSQL 15+ accessible localement;
- Flutter stable / Dart correspondant au `pubspec.yaml`, Android SDK et émulateur ou appareil Android pour exécuter l’app.

## Base et API NestJS

Créer PostgreSQL vide `unique_livraison`. Depuis `backend/` :

```sh
npm ci
```

Copier `.env.example` en `.env`, puis configurer `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT` et `CORS_ORIGINS`. Les secrets JWT doivent être différents, aléatoires, et jamais commités. Appliquer les migrations et lancer l’API :

```sh
npx prisma migrate deploy
npx prisma generate
npm run build
npm run start:dev
```

L’API locale écoute sur `http://localhost:3000/api`.

## Comptes et données de démonstration

Le seed refuse `NODE_ENV=production` et exige trois mots de passe définis par l’opérateur. Depuis `backend/` dans PowerShell :

```powershell
$env:DEMO_ADMIN_PASSWORD = 'choisir-un-mot-de-passe-local'
$env:DEMO_DISPATCHER_PASSWORD = 'choisir-un-mot-de-passe-local'
$env:DEMO_DRIVER_PASSWORD = 'choisir-un-mot-de-passe-local'
npm run seed
```

Comptes : `+22670000001` ADMIN, `+22670000002` DISPATCHER, `+22670000003` LIVREUR. Les mots de passe ne sont ni prédéfinis ni stockés dans Git; conserver les valeurs choisies seulement dans l’environnement local. Les données client/fournisseur/commande sont créées uniquement lorsque les trois tables de données sont vides. Lancer le seed après les migrations.

## Dashboard Next.js

Depuis `admin-dashboard/` :

```sh
npm ci
```

Configurer `.env.local` : `NEXT_PUBLIC_API_URL=http://localhost:3000/api`, puis lancer explicitement Next.js sur le port 3001 pour ne pas entrer en conflit avec l’API :

```sh
npm run dev -- --port 3001
```

L’interface est alors sur `http://localhost:3001`; cette origine est autorisée par la configuration CORS locale par défaut de l’API. En production, configurer l’origine réelle dans `CORS_ORIGINS`.

## Application Flutter

Depuis `mobile-livreur/` :

```sh
flutter pub get
flutter devices
flutter run --device-id <ID_DU_TELEPHONE> --dart-define=API_BASE_URL=http://<IP_LAN_DU_PC>:3000/api
```

Téléphone et poste doivent être sur le même Wi-Fi. Remplacer `<IP_LAN_DU_PC>` et `<ID_DU_TELEPHONE>` par l’adresse affichée par `ipconfig` et l’identifiant affiché par `flutter devices`. Le backend écoute sur `0.0.0.0`; autoriser Node.js/le port TCP 3000 pour le réseau privé dans le pare-feu Windows. Dans l’émulateur seulement, utiliser `http://10.0.2.2:3000/api`. Le trafic HTTP est réservé au test local; en hébergement, utiliser HTTPS.

La configuration Android FlutterFire se trouve dans `mobile-livreur/android/app/google-services.json` et `mobile-livreur/lib/firebase_options.dart`. Pour expédier les notifications, définir `FCM_SERVICE_ACCOUNT_PATH` dans `backend/.env` vers le JSON de compte de service Firebase Admin du même projet, conservé hors du dépôt. Ne jamais committer ce JSON. L’envoi réel doit être vérifié avec un appareil Android connecté et un jeton FCM actif.

## Parcours démo et vérification

Après connexion dispatcher : créer client avec adresse, fournisseur, puis commande; confirmer la commande et lui affecter le livreur. Se connecter au mobile avec le compte livreur, accepter en démarrant l’étape « en route fournisseur », parcourir les statuts, puis terminer après `LIVREE`. L’app actualise les missions toutes les 30 s et envoie le GPS toutes les 30 s en premier plan avec la permission accordée. La carte utilise Socket.IO et conserve le polling REST en secours.

Les commandes backend de vérification sont `npm run build` et `npm test`; dashboard `npm run build`; Flutter `flutter analyze`, `flutter test`, et `flutter build apk --debug`. Les résultats observés sont consignés dans `project-status.md`. Tester l’API et PostgreSQL ne prouve pas l’exécution sur un téléphone réel.

## Limites de démonstration

L’envoi FCM attend le compte de service Firebase Admin côté backend. La file offline rejoue les changements en attente; le GPS cesse de s’envoyer en arrière-plan. Le contrat API est également disponible via Swagger/OpenAPI à `/api/docs`.

## Essai sur téléphone Android (avant hébergement)

1. Relier le téléphone et le PC au même Wi-Fi, activer le débogage USB, puis accepter la clé RSA sur le téléphone. Pour le débogage Wi-Fi, jumeler le téléphone dans les options développeur et le connecter avec `adb pair` puis `adb connect`.
2. Dans PowerShell, depuis `backend/`, démarrer l’API avec des comptes de démonstration dont les mots de passe sont choisis localement :

```powershell
$env:DEMO_ADMIN_PASSWORD = 'mot-de-passe-admin-local'
$env:DEMO_DISPATCHER_PASSWORD = 'mot-de-passe-dispatcher-local'
$env:DEMO_DRIVER_PASSWORD = 'mot-de-passe-livreur-local'
npm run seed
npm run start:dev
```

Le seed de développement remet ces mots de passe sur les comptes de démonstration à chaque exécution. Garde ce terminal ouvert. Depuis un autre terminal, exécuter `ipconfig` et relever l’IPv4 de la carte Wi-Fi active (pas `127.0.0.1`). Si le pare-feu Windows le demande, autoriser Node.js sur le réseau privé; sinon, depuis PowerShell administrateur, autoriser le port TCP 3000 sur le profil privé :

```powershell
New-NetFirewallRule -DisplayName 'UNIQUE API dev 3000' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
```

3. Dans un autre PowerShell, depuis `mobile-livreur/`, installer les dépendances et démarrer l’application en remplaçant l’IP LAN et l’identifiant affiché par les valeurs réelles :

```powershell
flutter pub get
flutter devices
flutter run -d <ID_DU_TELEPHONE> --dart-define=API_BASE_URL=http://<IP_LAN_DU_PC>:3000/api
```

L’IP du téléphone doit joindre le PC sur le port 3000. Pour l’émulateur seulement, l’URL hôte est `http://10.0.2.2:3000/api`. Connexion livreur : téléphone `+22670000003` et mot de passe choisi dans `DEMO_DRIVER_PASSWORD`. Le dispatcher peut créer/affecter une course depuis le dashboard sur `http://localhost:3001` (compte `+22670000002`, mot de passe `DEMO_DISPATCHER_PASSWORD`). Tester aussi une transition en mode avion, puis réactiver le réseau et vérifier que l’indicateur de file en attente revient à zéro.

Les options FlutterFire du dépôt suffisent à initialiser le client Android. Pour valider l’envoi push de bout en bout, le serveur doit aussi avoir un compte de service Firebase Admin : définir `FCM_SERVICE_ACCOUNT_PATH` dans `backend/.env` vers le fichier JSON conservé hors du dépôt, puis redémarrer l’API. Sans cela, les jetons s’enregistrent mais aucun push ne peut être envoyé. L’accès à la console Firebase du projet n’a pas pu être vérifié avec le compte actuellement connecté.
