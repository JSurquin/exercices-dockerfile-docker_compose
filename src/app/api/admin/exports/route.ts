import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'csv';
    // const dateFrom = searchParams.get('dateFrom');
    // const dateTo = searchParams.get('dateTo');

    if (!type) {
      return NextResponse.json(
        { error: 'Type d\'export requis' },
        { status: 400 }
      );
    }

    // Générer les données CSV selon le type
    let csvData = '';
    let filename = '';

    switch (type) {
      case 'trades':
        csvData = generateTradesCSV();
        filename = 'trades';
        break;
      case 'users':
        csvData = generateUsersCSV();
        filename = 'users';
        break;
      case 'payouts':
        csvData = generatePayoutsCSV();
        filename = 'payouts';
        break;
      case 'kyc':
        csvData = generateKYCCSV();
        filename = 'kyc-documents';
        break;
      case 'affiliates':
        csvData = generateAffiliatesCSV();
        filename = 'affiliates';
        break;
      case 'giveaways':
        csvData = generateGiveawaysCSV();
        filename = 'giveaways';
        break;
      default:
        return NextResponse.json(
          { error: 'Type d\'export non supporté' },
          { status: 400 }
        );
    }

    // Ajouter la date au nom de fichier
    const dateStr = new Date().toISOString().split('T')[0];
    filename = `${filename}-${dateStr}.${format}`;

    if (format === 'csv') {
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Pour Excel, on retourne du CSV pour l'instant
      // TODO: Implémenter la génération Excel avec une librairie comme xlsx
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

function generateTradesCSV(): string {
  const headers = [
    'ID',
    'Ticket ID',
    'Utilisateur',
    'Statut',
    'Montant Brut (€)',
    'Frais Cashout (€)',
    'Frais Réseau (€)',
    'Montant Net (€)',
    'Créé le',
    'Accepté le',
    'Disponible le',
    'Nombre d\'items'
  ];

  const rows = [
    [
      'trade_1',
      'TICK-20241201-0001',
      'user_1',
      'payé',
      '150.00',
      '0.75',
      '2.00',
      '147.25',
      '2024-12-01 10:00:00',
      '2024-12-01 10:30:00',
      '2024-12-08 10:30:00',
      '1'
    ],
    [
      'trade_2',
      'TICK-20241201-0002',
      'user_2',
      'paiement_en_cours',
      '250.00',
      '1.25',
      '3.00',
      '245.75',
      '2024-12-01 11:00:00',
      '2024-12-01 11:15:00',
      '2024-12-08 11:15:00',
      '1'
    ],
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateUsersCSV(): string {
  const headers = [
    'ID',
    'Steam ID64',
    'Nom d\'utilisateur',
    'Statut KYC',
    'Volume Total (€)',
    'Niveau',
    'XP',
    'Tickets',
    'Inscrit le'
  ];

  const rows = [
    [
      'user_1',
      '76561198000000001',
      'ProTrader_CS2',
      'verified',
      '2500.00',
      '15',
      '12500',
      '45',
      '2024-01-15'
    ],
    [
      'user_2',
      '76561198000000002',
      'SkinMaster',
      'verified',
      '2200.00',
      '14',
      '11200',
      '38',
      '2024-02-20'
    ],
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generatePayoutsCSV(): string {
  const headers = [
    'ID',
    'Utilisateur',
    'Statut',
    'Montant (€)',
    'Type de Paiement',
    'Référence',
    'Créé le',
    'Payé le'
  ];

  const rows = [
    [
      'payout_1',
      'user_1',
      'payé',
      '147.25',
      'sepa',
      'PAY-20241201-001',
      '2024-12-01 10:30:00',
      '2024-12-01 14:30:00'
    ],
    [
      'payout_2',
      'user_2',
      'en_attente',
      '245.75',
      'crypto',
      '',
      '2024-12-01 11:15:00',
      ''
    ],
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateKYCCSV(): string {
  const headers = [
    'ID',
    'Utilisateur',
    'Type de Document',
    'Statut',
    'Provider ID',
    'Uploadé le',
    'Révisé le',
    'Raison du Rejet'
  ];

  const rows = [
    [
      'kyc_1',
      'user_1',
      'id_card',
      'approved',
      'provider_123',
      '2024-11-15 10:30:00',
      '2024-11-15 14:30:00',
      ''
    ],
    [
      'kyc_2',
      'user_2',
      'selfie',
      'pending',
      'provider_124',
      '2024-12-01 09:15:00',
      '',
      ''
    ],
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateAffiliatesCSV(): string {
  const headers = [
    'ID',
    'Utilisateur',
    'Code',
    'Références Total',
    'Volume Total (€)',
    'Commission Total (€)',
    'Taux Commission (%)',
    'Actif'
  ];

  const rows = [
    [
      'aff_1',
      'user_1',
      'AFF001',
      '25',
      '5000.00',
      '100.00',
      '2.0',
      'true'
    ],
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateGiveawaysCSV(): string {
  const headers = [
    'ID',
    'Titre',
    'Prix',
    'Prix Ticket',
    'Tickets Max',
    'Tickets Vendus',
    'Date de Fin',
    'Statut',
    'Gagnant'
  ];

  const rows = [
    [
      'giveaway_1',
      'Giveaway AK-47 Redline',
      'AK-47 | Redline (Field-Tested)',
      '10',
      '100',
      '85',
      '2024-12-15 23:59:59',
      'active',
      ''
    ],
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
