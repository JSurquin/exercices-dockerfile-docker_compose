import { prisma } from '~/prisma/prisma';

export async function createInitialGiveaway() {
  try {
    // Vérifier s'il y a déjà des giveaways
    const existingGiveaways = await prisma.giveaway.findMany();
    
    if (existingGiveaways.length > 0) {
      console.log('Des giveaways existent déjà');
      return existingGiveaways[0];
    }

    // Créer un giveaway initial qui se termine dans 10 minutes
    const endDate = new Date();
    endDate.setMinutes(endDate.getMinutes() + 10);

    const giveaway = await prisma.giveaway.create({
      data: {
        title: 'Premier Giveaway CashTrade !',
        description: 'Bienvenue sur CashTrade ! Participez à notre premier giveaway pour tenter de gagner un magnifique AK-47 Redline !',
        prize: 'AK-47 | Redline (Field-Tested)',
        ticketPrice: 5,
        maxTickets: 100,
        endDate: endDate,
        status: 'ACTIVE'
      }
    });

    console.log('Giveaway initial créé:', giveaway);
    return giveaway;
  } catch (error) {
    console.error('Erreur lors de la création du giveaway initial:', error);
    throw error;
  }
}

// Fonction pour créer un utilisateur avec 100 tickets s'il n'existe pas
export async function ensureUserWithTickets(steamId: string, userData: {
  steamUsername?: string;
  steamAvatar?: string;
  email?: string;
}) {
  try {
    // Chercher l'utilisateur existant
    let user = await prisma.user.findUnique({
      where: { steamId }
    });

    if (!user) {
      // Créer un nouvel utilisateur avec 100 tickets
      user = await prisma.user.create({
        data: {
          steamId,
          steamUsername: userData.steamUsername || `User_${steamId.slice(-6)}`,
          steamAvatar: userData.steamAvatar,
          email: userData.email || `${steamId}@temp.moonskin.fr`,
          tickets: 100, // 100 tickets initiaux
          level: 1,
          xp: 0,
          acceptedTermsAt: new Date(),
        }
      });

      console.log('Nouvel utilisateur créé avec 100 tickets:', user);
    } else if (user.tickets === 0) {
      // Si l'utilisateur existe mais n'a pas de tickets, lui en donner 100
      user = await prisma.user.update({
        where: { id: user.id },
        data: { tickets: 100 }
      });
      
      console.log('Tickets ajoutés à l\'utilisateur existant:', user);
    }

    return user;
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour de l\'utilisateur:', error);
    throw error;
  }
}