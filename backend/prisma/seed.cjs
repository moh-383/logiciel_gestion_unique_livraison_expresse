const { PrismaClient, Role, StatutLivreur, StatutCommande } = require('@prisma/client');
const bcrypt = require('bcrypt');

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  throw new Error('Le seed de démonstration est désactivé en production.');
}
for (const key of ['DEMO_ADMIN_PASSWORD', 'DEMO_DISPATCHER_PASSWORD', 'DEMO_DRIVER_PASSWORD']) {
  if (!process.env[key]) throw new Error(`${key} doit être défini pour lancer le seed.`);
}

const prisma = new PrismaClient();
async function main() {
  const [adminHash, dispatcherHash, driverHash] = await Promise.all([
    bcrypt.hash(process.env.DEMO_ADMIN_PASSWORD, 10),
    bcrypt.hash(process.env.DEMO_DISPATCHER_PASSWORD, 10),
    bcrypt.hash(process.env.DEMO_DRIVER_PASSWORD, 10),
  ]);
  const admin = await prisma.utilisateur.upsert({ where: { telephone: '+22670000001' }, update: { nom: 'Administrateur Démo', motDePasse: adminHash, role: Role.ADMIN }, create: { nom: 'Administrateur Démo', telephone: '+22670000001', motDePasse: adminHash, role: Role.ADMIN } });
  await prisma.utilisateur.upsert({ where: { telephone: '+22670000002' }, update: { nom: 'Dispatcher Démo', motDePasse: dispatcherHash, role: Role.DISPATCHER }, create: { nom: 'Dispatcher Démo', telephone: '+22670000002', motDePasse: dispatcherHash, role: Role.DISPATCHER } });
  const existingDriver = await prisma.utilisateur.findUnique({ where: { telephone: '+22670000003' }, include: { livreur: true } });
  const driverData = { nom: 'Livreur Démo', motDePasse: driverHash, role: Role.LIVREUR };
  const driverUser = existingDriver
    ? await prisma.utilisateur.update({
        where: { id: existingDriver.id },
        data: {
          ...driverData,
          ...(existingDriver.livreur ? {} : { livreur: { create: { statut: StatutLivreur.DISPONIBLE, vehicule: 'Moto', immatriculation: 'DEMO-01' } } }),
        },
        include: { livreur: true },
      })
    : await prisma.utilisateur.create({ data: { ...driverData, telephone: '+22670000003', livreur: { create: { statut: StatutLivreur.DISPONIBLE, vehicule: 'Moto', immatriculation: 'DEMO-01' } } }, include: { livreur: true } });

  if (await prisma.client.count() === 0 && await prisma.fournisseur.count() === 0 && await prisma.commande.count() === 0) {
    const client = await prisma.client.create({ data: { nom: 'Client Démo', telephone: '+22670000004', adresses: { create: { libelle: 'Centre-ville, Ouagadougou', gpsLat: 12.3714, gpsLng: -1.5197 } } }, include: { adresses: true } });
    const supplier = await prisma.fournisseur.create({ data: { nom: 'Boutique Démo', telephone: '+22670000005', adresse: 'Ouagadougou' } });
    await prisma.commande.create({ data: { clientId: client.id, fournisseurId: supplier.id, adresseLivraisonId: client.adresses[0].id, descriptionMarchandise: 'Colis de démonstration', quantite: '1 colis', fraisLivraison: 1000, statut: StatutCommande.NOUVELLE, historique: { create: { statut: StatutCommande.NOUVELLE, utilisateurId: admin.id } } } });
  }
  console.log(`Comptes démo prêts. Livreur: ${driverUser.livreur?.id ? 'lié' : 'existant sans profil livreur'}.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
