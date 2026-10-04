# Contrat API du MVP

Source opérationnelle unique des endpoints consommés par Next.js et Flutter. Préfixe : `/api`. Les objets/lists Prisma sont renvoyés directement, sans enveloppe. Authentification protégée : `Authorization: Bearer <accessToken>` (15 min); refresh token à usage unique, renouvelé à chaque refresh (7 jours). Les corps sont JSON. Erreurs Nest standard : `{ statusCode, message, error }`; erreurs de validation 400, non authentifié 401, rôle interdit 403, absent 404, conflit métier 409 ou 400 selon la route. Swagger UI est exposé à `/api/docs` et le document OpenAPI JSON à `/api/docs-json`.

## Authentification

| Méthode et route | Accès | Corps / réponse utile |
| --- | --- | --- |
| `POST /auth/login` | Public | Corps `{ telephone, motDePasse }`; réponse `{ accessToken, refreshToken, utilisateur: { id, nom, telephone, role } }`. Identifiants invalides : 401. |
| `POST /auth/refresh` | Public avec refresh JWT | Corps `{ refreshToken }`; réponse nouvelle paire `{ accessToken, refreshToken }`. Ancien refresh invalide après rotation/révocation; 401. |
| `POST /auth/logout` | Tout rôle authentifié | Révoque le refresh token stocké pour cet utilisateur; réponse `{ ok: true }`. |
| `POST /auth/device-token` | Tout rôle authentifié | Corps `{ token }`; associe ou retire le jeton FCM de l’utilisateur connecté. |

## Clients, adresses, fournisseurs

Admin et dispatcher :

| Méthode et route | Corps / paramètres | Réponse |
| --- | --- | --- |
| `GET /clients?recherche=` | recherche facultative sur nom/téléphone | Clients et leurs adresses |
| `POST /clients` | `{ nom, telephone }` | Client créé |
| `GET /clients/:id` | aucun | Client, adresses, commandes |
| `PATCH /clients/:id` | `nom?`, `telephone?` | Client mis à jour |
| `DELETE /clients/:id` | aucun | Client supprimé; contrainte relationnelle possible si commandes liées |
| `POST /clients/:id/adresses` | `libelle?`, `gpsLat?` (-90..90), `gpsLng?` (-180..180) | Adresse créée |
| `GET /fournisseurs?recherche=` | recherche facultative sur nom | Fournisseurs et produits |
| `POST /fournisseurs` | `{ nom, telephone, adresse?, gpsLat?, gpsLng? }` | Fournisseur créé |
| `GET /fournisseurs/:id` | aucun | Fournisseur et produits |
| `PATCH /fournisseurs/:id` | mêmes champs facultatifs | Fournisseur mis à jour |
| `DELETE /fournisseurs/:id` | aucun | Suppression; contrainte relationnelle possible si commandes liées |
| `POST /fournisseurs/:id/produits` | `{ libelle }` | Produit créé |

Les champs texte obligatoires doivent être non vides. Les coordonnées sont des nombres.

## Livreurs

| Méthode et route | Rôle | Corps / réponse |
| --- | --- | --- |
| `GET /livreurs`, `GET /livreurs/:id` | Admin, dispatcher | Profil, utilisateur (nom/téléphone), commandes selon le détail |
| `POST /livreurs` | Admin seulement | `{ nom, telephone, motDePasse, vehicule?, immatriculation? }`; crée un compte LIVREUR et son profil |
| `PATCH /livreurs/:id` | Admin seulement | `{ vehicule?, immatriculation? }` |
| `PATCH /livreurs/:id/statut` | Admin, dispatcher, ou le livreur lui-même | `{ statut }`: `DISPONIBLE`, `EN_LIVRAISON`, `CHEZ_FOURNISSEUR`, `HORS_LIGNE`, `DESACTIVE` |
| `DELETE /livreurs/:id` | Admin seulement | Supprime le compte lié |

## Commandes

Les listes et créations d’administration sont accessibles à Admin/dispatcher. La création exige `{ clientId, fournisseurId, adresseLivraisonId, descriptionMarchandise, quantite, fraisLivraison, montantMarchandise? }`; frais/montant sont des nombres en FCFA. La liste `GET /commandes?statut=&livreurId=` inclut client, fournisseur, livreur et adresse. `GET /commandes/:id` ajoute l’historique chronologique (horodatage/utilisateur).

`PATCH /commandes/:id/affecter` (admin/dispatcher) exige `{ livreurId }`; la commande doit être `CONFIRMEE`, puis devient `LIVREUR_AFFECTE`.

`PATCH /commandes/:id/statut` exige `{ statut }`; pour `ECHEC_LIVRAISON`, ajouter obligatoirement `motifEchec`: `CLIENT_ABSENT`, `MARCHANDISE_INDISPONIBLE`, `AUTRE`. Le motif n’est accepté que dans ce cas. Transition nominale stricte : `NOUVELLE → CONFIRMEE → LIVREUR_AFFECTE → EN_ROUTE_FOURNISSEUR → MARCHANDISE_RECUPEREE → EN_ROUTE_CLIENT → LIVREE → TERMINEE`. Annulation et échec sont des sorties exceptionnelles, réservées admin/dispatcher. Les autres transitions sont 400; un livreur ne peut consulter/faire progresser que ses commandes et ne peut pas confirmer, annuler ou signaler l’échec.

`GET /commandes/mes-commandes` (LIVREUR) renvoie ses commandes non terminales. Les détails sont filtrés par appartenance.

## GPS temps réel

`POST /gps/position` (LIVREUR) exige `{ gpsLat, gpsLng }` bornés géographiquement. L’identité vient du JWT; hors ligne/désactivé retourne 403. `GET /gps/livreurs/dernieres-positions` (admin/dispatcher) renvoie dernière position et horodatage par livreur.

Socket.IO reçoit l’événement `position:update` côté serveur, authenticant l’identité via handshake JWT et diffusant `position:livreur` à la room dashboard. Le dashboard utilise l’événement et un repli de polling 30 s; l’âge affiché interdit de prendre un point ancien pour une position actuelle.

## Spécification machine

Swagger/OpenAPI n’est pas intégré à cette version; ce contrat versionné dans le dépôt est à synchroniser aux DTO/contrôleurs. Pas de pagination, idempotency key, file offline, jeton device FCM ou réponse enveloppée à ce stade.
