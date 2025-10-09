import { NextRequest, NextResponse } from 'next/server';
import { seedGiveawayData } from '@/lib/seed-giveaway';

export async function POST(request: NextRequest) {
  try {
    const result = await seedGiveawayData();
    
    return NextResponse.json({
      success: true,
      message: 'Données de test créées avec succès',
      data: result
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création des données de test' },
      { status: 500 }
    );
  }
}