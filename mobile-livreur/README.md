# UNIQUE Livreur (Flutter Android)

MVP Flutter connecté à l’API NestJS : connexion réservée aux comptes `LIVREUR`, session stockée dans `flutter_secure_storage`, commandes affectées, détail, transitions séquentielles via API et statut de disponibilité.

## Démarrage

```sh
flutter pub get
flutter devices
flutter run --device-id <ID_DU_TELEPHONE> --dart-define=API_BASE_URL=http://<IP_LAN_DU_PC>:3000/api
```

`10.0.2.2` désigne la machine hôte depuis l’émulateur Android. Sur un téléphone, remplacer par l’adresse IPv4 du poste sur le même Wi-Fi, par exemple `http://192.168.1.20:3000/api`. L’API écoute sur `0.0.0.0`; autoriser Node/Nest sur le réseau privé Windows et le port 3000. Le manifest autorise HTTP pour le test local; une distribution de production devra utiliser HTTPS et désactiver le trafic en clair.

## GPS, push et hors connexion

Quand l’app est visible et que le livreur est « Disponible », la position est demandée puis envoyée toutes les 30 secondes par `POST /api/gps/position`. Le backend dérive l’identité du token et refuse l’envoi pour les livreurs hors ligne/désactivés. L’app interrompt le suivi en arrière-plan; ce n’est pas un service GPS en arrière-plan. Elle actualise aussi les commandes toutes les 30 secondes pendant son exécution pour compenser l’absence de FCM.

Push : l’app initialise Firebase avec `android/app/google-services.json` et `lib/firebase_options.dart`; le projet est `unique-livraison-expresse` et l’application Android `bf.unique.unique_livraison`. Après connexion, elle demande l’autorisation, inscrit le jeton à l’API, le renouvelle et ouvre la commande depuis une notification. Le backend nécessite `FCM_SERVICE_ACCOUNT_PATH` vers un JSON de compte de service gardé hors du dépôt, ou `FCM_SERVICE_ACCOUNT_JSON`. Sans ce credential, l’app s’enregistre mais le serveur ne peut pas envoyer de push.

Hors connexion : les changements d’état de commande, changements de disponibilité et la dernière position GPS sont conservés localement dans SharedPreferences, puis rejoués dans l’ordre au retour du réseau. La dernière position remplace les GPS en attente plus anciens. Un indicateur visible affiche le nombre d’actions en attente; les transitions restent en attente tant que l’API ne les a pas confirmées.

## Vérification

L’analyse et les tests Flutter sont listés dans `docs/project-status.md` avec leur résultat; l’envoi GPS et les transitions nécessitent encore un appareil/émulateur connecté à une API et une base de données de démonstration.
