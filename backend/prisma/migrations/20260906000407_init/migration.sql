-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DISPATCHER', 'LIVREUR');

-- CreateEnum
CREATE TYPE "StatutLivreur" AS ENUM ('DISPONIBLE', 'EN_LIVRAISON', 'CHEZ_FOURNISSEUR', 'HORS_LIGNE', 'DESACTIVE');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('NOUVELLE', 'CONFIRMEE', 'LIVREUR_AFFECTE', 'EN_ROUTE_FOURNISSEUR', 'MARCHANDISE_RECUPEREE', 'EN_ROUTE_CLIENT', 'LIVREE', 'TERMINEE', 'ANNULEE', 'ECHEC_LIVRAISON');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('NON_PAYE', 'PAYE');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "livreurs" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "vehicule" TEXT,
    "immatriculation" TEXT,
    "statut" "StatutLivreur" NOT NULL DEFAULT 'HORS_LIGNE',

    CONSTRAINT "livreurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adresses" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "libelle" TEXT,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,

    CONSTRAINT "adresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fournisseurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "adresse" TEXT,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,

    CONSTRAINT "fournisseurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits_fournisseurs" (
    "id" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "produits_fournisseurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,
    "livreurId" TEXT,
    "adresseLivraisonId" TEXT NOT NULL,
    "descriptionMarchandise" TEXT NOT NULL,
    "montantMarchandise" DOUBLE PRECISION,
    "fraisLivraison" DOUBLE PRECISION NOT NULL,
    "statut" "StatutCommande" NOT NULL DEFAULT 'NOUVELLE',
    "statutPaiement" "StatutPaiement" NOT NULL DEFAULT 'NON_PAYE',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_statuts_commande" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "statut" "StatutCommande" NOT NULL,
    "horodatage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilisateurId" TEXT,

    CONSTRAINT "historique_statuts_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions_livreurs" (
    "id" TEXT NOT NULL,
    "livreurId" TEXT NOT NULL,
    "gpsLat" DOUBLE PRECISION NOT NULL,
    "gpsLng" DOUBLE PRECISION NOT NULL,
    "horodatage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "positions_livreurs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_telephone_key" ON "utilisateurs"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "livreurs_utilisateurId_key" ON "livreurs"("utilisateurId");

-- CreateIndex
CREATE INDEX "positions_livreurs_livreurId_horodatage_idx" ON "positions_livreurs"("livreurId", "horodatage");

-- AddForeignKey
ALTER TABLE "livreurs" ADD CONSTRAINT "livreurs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adresses" ADD CONSTRAINT "adresses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits_fournisseurs" ADD CONSTRAINT "produits_fournisseurs_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "fournisseurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "fournisseurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "livreurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_adresseLivraisonId_fkey" FOREIGN KEY ("adresseLivraisonId") REFERENCES "adresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts_commande" ADD CONSTRAINT "historique_statuts_commande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts_commande" ADD CONSTRAINT "historique_statuts_commande_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions_livreurs" ADD CONSTRAINT "positions_livreurs_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "livreurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
