# Décisions techniques MVP

- Garder le backend NestJS/Prisma comme autorité unique pour rôles, propriétaire de commande et transitions; les UIs envoient les transitions, elles ne les inventent pas.
- Stocker l’empreinte SHA-256 du refresh token par utilisateur. Rotation single-use avec mise à jour conditionnelle atomique; connexion suivante remplace la session précédente, déconnexion révoque le token courant. Une seule session refresh par utilisateur dans ce MVP.
- Exiger motif enum à l’état `ECHEC_LIVRAISON` et conserver le motif sur la commande.
- Garder quantité sous forme texte afin de permettre des valeurs métier comme « 2 sacs » sans schéma numérique restrictif; la création API la requiert.
- Démarrer GPS Flutter au premier plan uniquement, HTTP seulement pour le réseau local de développement; production doit passer en HTTPS.
- Remplacer les notifications push indisponibles par un rafraîchissement périodique limité (30 s) dans le mobile MVP. Aucun fake FCM.
- Ne pas introduire une synchronisation offline fragile pendant cette livraison; afficher l’échec et réessayer, puis concevoir une file idempotente séparément.
- Couleurs extraites par approximation de l’image de marque; préserver la composition du logo, demander un vecteur officiel lorsqu’il est disponible.
