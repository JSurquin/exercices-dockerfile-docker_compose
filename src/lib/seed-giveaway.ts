import { prisma } from '~/prisma/prisma';

export async function seedGiveawayData() {
  try {
    console.log('🌱 Seeding giveaway data...');

    // Créer un utilisateur de test avec 100 tickets
    const testUser = await prisma.user.upsert({
      where: { steamId: '76561198000000001' },
      update: {
        tickets: 100,
        steamUsername: 'TestPlayer',
        steamAvatar: 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef94e52a288_medium.jpg'
      },
      create: {
        steamId: '76561198000000001',
        steamUsername: 'TestPlayer',
        steamAvatar: 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef94e52a288_medium.jpg',
        email: 'testplayer@cashtrade.fr',
        tickets: 100,
        level: 1,
        xp: 0,
        acceptedTermsAt: new Date(),
      }
    });

    console.log('✅ Test user created:', testUser.steamUsername);

    // Vérifier s'il y a déjà des giveaways
    const existingGiveaways = await prisma.giveaway.findMany();
    
    if (existingGiveaways.length === 0) {
      // Créer le premier giveaway qui se termine dans 10 minutes
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

      console.log('✅ Initial giveaway created:', giveaway.title);
      console.log(`⏰ Ends at: ${endDate.toLocaleString()}`);

      return { user: testUser, giveaway };
    } else {
      console.log('ℹ️ Giveaways already exist, skipping creation');
      return { user: testUser, giveaway: existingGiveaways[0] };
    }
  } catch (error) {
    console.error('❌ Error seeding giveaway data:', error);
    throw error;
  }
}