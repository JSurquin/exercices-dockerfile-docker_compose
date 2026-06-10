import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { AdminReportData } from './pdf-generator';

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

  addSectionTable(
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
}

/** Fallback sobre si Chromium/Puppeteer indisponible */
export function generateAdminPdfWithJsPDF(
  data: AdminReportData,
  title: string
): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFontSize(16);
  doc.setTextColor(61, 106, 158);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 26);

  autoTable(doc, {
    startY: 32,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Utilisateurs', String(data.stats.totalUsers)],
      ['Trades', String(data.stats.totalTrades)],
      ['Volume', formatPrice(data.stats.totalVolume)],
    ],
    headStyles: { fillColor: [126, 179, 232] },
    margin: { left: 14, right: 14 },
  });

  buildDataSections(doc, data);
  return toBuffer(doc);
}
