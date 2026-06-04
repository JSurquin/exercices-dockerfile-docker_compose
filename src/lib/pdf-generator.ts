import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logger } from './logger';

export interface AdminReportData {
  stats: {
    totalUsers: number;
    totalTrades: number;
    totalVolume: number;
    totalCommissions: number;
    activeAffiliates: number;
    pendingKYC: number;
  };
  trades: Array<{
    id: string;
    userId: string;
    username: string;
    status: string;
    grossCents: number;
    netCents: number;
    createdAt: string;
    availableAt?: string;
  }>;
  users: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    kycStatus: string;
    createdAt: string;
    lastLoginAt?: string;
  }>;
  payouts: Array<{
    id: string;
    userId: string;
    username: string;
    method: string;
    amountCents: number;
    status: string;
    createdAt: string;
    processedAt?: string;
  }>;
  affiliates: Array<{
    id: string;
    username: string;
    code: string;
    totalReferrals: number;
    totalCommissionCents: number;
    status: string;
    createdAt: string;
  }>;
  commissions: Array<{
    id: string;
    affiliateUsername: string;
    amountCents: number;
    status: string;
    referralId: string | null;
    createdAt: string;
  }>;
  kyc: Array<{
    id: string;
    userId: string;
    username: string;
    status: string;
    submittedAt: string;
    reviewedAt?: string;
  }>;
  analytics: {
    volumeByDay: Array<{ date: string; volume: number }>;
    tradesByStatus: Array<{ status: string; count: number }>;
    usersByRole: Array<{ role: string; count: number }>;
  };
}

const formatPrice = (centimes: number) => `${(centimes / 100).toFixed(2)} €`;
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR');
const cell = (v?: string | null) => v ?? '—';

type JsPDFWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

function toBuffer(doc: jsPDF): Buffer {
  return Buffer.from(doc.output('arraybuffer'));
}

function addSectionTable(
  doc: jsPDF,
  title: string,
  head: string[],
  rows: string[][],
  startY: number
): number {
  const margin = 14;
  if (startY > 250) {
    doc.addPage();
    startY = 20;
  }
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(title, margin, startY);
  autoTable(doc, {
    startY: startY + 5,
    head: [head],
    body: rows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [61, 106, 158], textColor: 255 },
    margin: { left: margin, right: margin },
  });
  const finalY = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? startY + 20;
  return finalY + 12;
}

function buildStatsBlock(doc: jsPDF, data: AdminReportData, title: string) {
  doc.setFontSize(18);
  doc.setTextColor(61, 106, 158);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 26);

  const statsRows = [
    ['Utilisateurs', String(data.stats.totalUsers)],
    ['Trades', String(data.stats.totalTrades)],
    ['Volume', formatPrice(data.stats.totalVolume)],
    ['Commissions affiliés', formatPrice(data.stats.totalCommissions)],
    ['Affiliés actifs', String(data.stats.activeAffiliates)],
    ['KYC en attente', String(data.stats.pendingKYC)],
  ];

  autoTable(doc, {
    startY: 32,
    head: [['Indicateur', 'Valeur']],
    body: statsRows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [126, 179, 232] },
    margin: { left: 14, right: 14 },
  });
}

function buildDataSections(doc: jsPDF, data: AdminReportData): void {
  let y = ((doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? 40) + 14;

  y = addSectionTable(
    doc,
    'Trades récents',
    ['ID', 'Utilisateur', 'Statut', 'Brut', 'Net', 'Créé le'],
    data.trades.slice(0, 25).map((t) => [
      t.id.slice(0, 10),
      cell(t.username),
      t.status,
      formatPrice(t.grossCents),
      formatPrice(t.netCents),
      formatDate(t.createdAt),
    ]),
    y
  );

  y = addSectionTable(
    doc,
    'Utilisateurs',
    ['Utilisateur', 'Email', 'Rôle', 'KYC', 'Inscription'],
    data.users.slice(0, 30).map((u) => [
      cell(u.username),
      cell(u.email),
      u.role,
      u.kycStatus,
      formatDate(u.createdAt),
    ]),
    y
  );

  y = addSectionTable(
    doc,
    'Paiements',
    ['ID', 'Utilisateur', 'Méthode', 'Montant', 'Statut', 'Créé le'],
    data.payouts.slice(0, 25).map((p) => [
      p.id.slice(0, 10),
      cell(p.username),
      cell(p.method),
      formatPrice(p.amountCents),
      p.status,
      formatDate(p.createdAt),
    ]),
    y
  );

  y = addSectionTable(
    doc,
    'Affiliés',
    ['Utilisateur', 'Code', 'Référés', 'Commissions', 'Statut'],
    data.affiliates.slice(0, 25).map((a) => [
      cell(a.username),
      a.code,
      String(a.totalReferrals),
      formatPrice(a.totalCommissionCents),
      a.status,
    ]),
    y
  );

  addSectionTable(
    doc,
    'Synthèse analytics',
    ['Métrique', 'Détail'],
    [
      ...data.analytics.tradesByStatus.map((s) => [`Trades ${s.status}`, String(s.count)]),
      ...data.analytics.usersByRole.map((r) => [`Rôle ${r.role}`, String(r.count)]),
    ],
    y
  );
}

export class PDFGenerator {
  private static instance: PDFGenerator;

  private constructor() {}

  public static getInstance(): PDFGenerator {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator();
    }
    return PDFGenerator.instance;
  }

  public async generateDataExportPDF(data: AdminReportData): Promise<Buffer> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    buildStatsBlock(doc, data, 'MoonSkin — Export des données');
    buildDataSections(doc, data);
    logger.info('Export PDF généré (jsPDF)', { trades: data.trades.length });
    return toBuffer(doc);
  }

  public async generateFullReportPDF(data: AdminReportData): Promise<Buffer> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    buildStatsBlock(doc, data, 'MoonSkin — Rapport complet');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const summaryY = ((doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? 32) + 8;
    doc.text(
      'Vue d’ensemble de l’activité plateforme (trades, utilisateurs, paiements, affiliés).',
      14,
      summaryY
    );
    buildDataSections(doc, data);
    logger.info('Rapport PDF généré (jsPDF)', { users: data.users.length });
    return toBuffer(doc);
  }

  /** @deprecated Plus de navigateur headless — no-op pour compatibilité */
  public async close(): Promise<void> {}
}

export const pdfGenerator = PDFGenerator.getInstance();
