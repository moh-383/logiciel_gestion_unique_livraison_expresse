ALTER TABLE "utilisateurs" ADD COLUMN "fcmToken" TEXT;
CREATE UNIQUE INDEX "utilisateurs_fcmToken_key" ON "utilisateurs"("fcmToken");
