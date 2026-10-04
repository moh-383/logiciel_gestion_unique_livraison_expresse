# Design system UNIQUE

Ce guide applique la référence de marque de [brand-guidelines.md](brand-guidelines.md) aux interfaces Web et Android. Les valeurs visuelles de l’affiche restent des approximations raster; le logo extrait n’est pas un fichier vectoriel maître.

## Fondations

- Primaire : rouge `#E50914`, action principale et identité.
- Accent : doré `#F5B900`, points d’attention et détails de marque.
- Texte : noir `#151515`; surfaces blanches; arrière-plan `#F7F7F7`; bordures `#ECECEC`.
- Typographie : Arial/Helvetica ou sans-serif système, hiérarchie par tailles et graisses.
- Densité : tableaux compacts sur grand écran, cartes et zones tactiles sur téléphone.

## Composants

| Composant | Règle |
| --- | --- |
| Bouton primaire | Rouge plein, texte blanc, action verbale courte; désactivé durant l’envoi. |
| Action secondaire | Fond blanc, contour neutre; fermer ou annuler. |
| Suppression / échec | Confirmation pour supprimer; teinte rouge pâle et libellé explicite. |
| Carte | Surface blanche, bordure discrète, rayon uniforme; éviter les cartes imbriquées. |
| Tableau | En-tête pâle, colonnes nommées, statut en badge textuel, recherche et filtres proches de la liste. |
| Formulaire | Libellés visibles, champs natifs et messages API; aucune erreur indiquée uniquement par couleur. |
| Alerte | Rouge pâle pour erreur; vert pâle pour confirmation; action de reprise lisible. |

## Badges de statut

Afficher le libellé français et conserver la valeur API sous-jacente en majuscules. En cours utilise un accent doré; livré/terminé une teinte de succès; annulé/échec une teinte rouge; indisponible une teinte neutre. Le libellé porte toujours le sens, même si les couleurs changent en cas de statut.

## Navigation et priorité d’information

Afficher les commandes actives et actions de dispatch avant les données de référence; rendre disponibles en permanence les listes, la recherche et les filtres; conserver le statut et l’âge de la position GPS près de la carte. Les changements de commande utilisent le flux API autorisé et la confirmation d’affectation; ne pas simuler de progression côté client.

## Responsive

Sur bureau, conserver navigation latérale, KPI et tableaux. Sur téléphone, réduire la navigation, empiler les panneaux et préserver le défilement horizontal des tableaux si nécessaire. Les actions métier doivent rester accessibles par contrôles suffisamment grands.
