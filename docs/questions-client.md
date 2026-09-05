# Questions à valider avec le client : UNIQUE Livraison Expresse

À poser avant/pendant le développement du MVP. Cocher au fur et à mesure des réponses obtenues.
Certaines réponses par défaut sont déjà posées comme hypothèses dans le cahier des charges (§9) pour ne pas bloquer le démarrage, à confirmer ou corriger ici.

## 👤 Clients
- [ ] Comment les clients passent-ils commande aujourd'hui (appel / WhatsApp / Facebook / autre) ?
- [ ] Faut-il conserver un historique client détaillé ?
- [ ] Un client peut-il avoir plusieurs adresses de livraison ?

## 📦 Commandes
- [ ] Quelles informations sont notées aujourd'hui lors d'une commande ?
- [ ] Qui crée la commande dans le nouveau système (le dispatcher uniquement, ou plusieurs personnes) ?
- [ ] Une commande peut-elle être modifiée après création ? Annulée ? Par qui ?
- [ ] Que fait-on concrètement en cas d'échec de livraison (client absent, marchandise indisponible) ?

## 🏪 Fournisseurs
- [ ] Combien de fournisseurs travaillent avec la structure aujourd'hui ?
- [ ] Un fournisseur peut-il proposer plusieurs produits ? Un produit peut-il venir de plusieurs fournisseurs ?
- [ ] Comment sait-on aujourd'hui si un fournisseur a la marchandise disponible ?
- [ ] Faut-il enregistrer des prix fournisseurs dans le système ?

## 🛵 Livreurs
- [ ] Combien de livreurs travaillent actuellement pour la structure ?
- [ ] Sont-ils salariés ou indépendants ?
- [ ] Comment une commande leur est-elle attribuée aujourd'hui ? Peuvent-ils la refuser ?
- [ ] Comment sont-ils rémunérés (par livraison, au fixe, autre) ?
- [ ] Ont-ils leur propre véhicule, ou fourni par la structure ?

## 📍 GPS
- [ ] Faut-il voir la position uniquement pendant une livraison, ou aussi quand le livreur est disponible mais sans commande ?
- [ ] Quelle fréquence de mise à jour de position est jugée suffisante ?
- [ ] Que doit-il se passer si un livreur perd sa connexion internet en cours de livraison ?

## 💰 Argent : **point structurant à trancher en priorité**
- [ ] Qui encaisse aujourd'hui l'argent du client : le livreur, le fournisseur, ou la structure ?
- [ ] À quel moment le client paie-t-il (avant, à la livraison) ?
- [ ] Comment le livreur reverse-t-il l'argent collecté à la structure/au fournisseur ?
- [ ] Quel est le modèle de revenu de la structure (marge fixe ? pourcentage ? frais de livraison uniquement) ?
- [ ] Faut-il intégrer le Mobile Money (Orange Money, Moov Money...) ?

## 📱 Communication
- [ ] Qu'est-ce qui pose concrètement problème avec les groupes WhatsApp actuels ?
- [ ] Quelles notifications précises le gérant souhaite-t-il recevoir (nouvelle commande, retard, échec...) ?

## 🖥️ Administration
- [ ] Combien de personnes utiliseront le logiciel côté structure (juste le gérant, ou aussi des employés) ?
- [ ] Qui doit avoir accès à quoi (tout le monde voit tout, ou des accès différenciés) ?
- [ ] Quels rapports/statistiques sont réellement utiles au gérant (pas juste "ce qui est possible") ?
