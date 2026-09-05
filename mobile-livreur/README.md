# Application mobile Livreur : UNIQUE Livraison Expresse

Application destinée aux livreurs : réception des commandes affectées, mise à jour du statut, envoi périodique de la position GPS, notifications push.

## Stack prévue
- Flutter (Dart) : Android en priorité, iOS en secondaire
- `geolocator` pour la position GPS
- `firebase_messaging` pour les notifications push
- Stockage local (`sqflite` ou `hive`) pour le mode offline (mise en cache des positions/statuts en cas de perte de connexion)

## Mise en place (à faire au Sprint 0)

```bash
# Depuis ce dossier
flutter create .
flutter pub add geolocator firebase_messaging firebase_core dio hive hive_flutter
```

## Écrans prévus (MVP : voir `docs/cahier-des-charges.md` §6)
- Connexion
- Statut du livreur (disponible / en livraison / hors ligne)
- Détail d'une commande affectée + bouton "Accepter"
- Étapes de la livraison : en route fournisseur → marchandise récupérée → en route client → livrée
- Envoi automatique de la position GPS en tâche de fond, uniquement quand le livreur est en service
- Réception des notifications push (nouvelle commande)

## Contrainte importante
L'application doit rester utilisable sur des téléphones Android d'entrée de gamme et sur des connexions instables : toute action (changement de statut, position GPS) doit être mise en cache localement puis synchronisée dès que la connexion revient.
