CREATE TYPE "MotifEchecLivraison" AS ENUM ('CLIENT_ABSENT', 'MARCHANDISE_INDISPONIBLE', 'AUTRE');

ALTER TABLE "commandes"
  ADD COLUMN "quantite" TEXT,
  ADD COLUMN "motifEchecLivraison" "MotifEchecLivraison";

ALTER TABLE "utilisateurs"
  ADD COLUMN "refreshTokenHash" TEXT;
