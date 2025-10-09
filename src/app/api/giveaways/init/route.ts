import { NextRequest, NextResponse } from 'next/server';
import { createInitialGiveaway } from '@/lib/init-giveaway';

export async function POST(request: NextRequest) {
  try {
    const giveaway = await createInitialGiveaway();
    
    return NextResponse.json({
      success: true,
      giveaway
    });
  } catch (error) {
    console.error('Error initializing giveaway:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation du giveaway' },
      { status: 500 }
    );
  }
}