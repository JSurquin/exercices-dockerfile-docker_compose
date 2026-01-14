import puppeteer, { Browser } from 'puppeteer';
import { logger } from './logger';

export interface PDFGenerationOptions {
  format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  scale?: number;
}

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
    referralId: string;
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

export class PDFGenerator {
  private static instance: PDFGenerator;
  private browser: Browser | null = null;

  private constructor() {}

  public static getInstance(): PDFGenerator {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator();
    }
    return PDFGenerator.instance;
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      try {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ],
          timeout: 30000, // 30 secondes de timeout
          ignoreDefaultArgs: ['--disable-extensions']
        });
        
        logger.info('Puppeteer browser lancé avec succès');
      } catch (error) {
        logger.error('Erreur lors du lancement de Puppeteer', { error });
        throw new Error(`Impossible de lancer le navigateur: ${error}`);
      }
    }
    return this.browser;
  }

  public async generatePDF(
    html: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configuration par défaut optimisée pour les rapports
      const defaultOptions: PDFGenerationOptions = {
        format: 'A4',
        orientation: 'portrait',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; margin: 0 auto; color: #666; width: 100%; text-align: center;">
            <span>MoonSkin - Rapport Admin</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; margin: 0 auto; color: #666; width: 100%; text-align: center;">
            <span>Page <span class="pageNumber"></span> sur <span class="totalPages"></span> - Généré le ${new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        `,
        printBackground: true,
        scale: 0.8
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Injecter les styles CSS pour l'impression
      const styledHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Rapport MoonSkin</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            .no-break {
              page-break-inside: avoid;
            }
            
            .header {
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              color: white;
              padding: 30px;
              text-align: center;
              margin-bottom: 30px;
            }
            
            .header h1 {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            
            .header p {
              font-size: 16px;
              opacity: 0.9;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }
            
            .stat-card {
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
            }
            
            .stat-card h3 {
              color: #64748b;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            
            .stat-card .value {
              color: #1e293b;
              font-size: 28px;
              font-weight: bold;
            }
            
            .section {
              margin-bottom: 40px;
            }
            
            .section-title {
              color: #1e293b;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 3px solid #f97316;
            }
            
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .table th {
              background: #f1f5f9;
              color: #475569;
              font-weight: 600;
              padding: 12px;
              text-align: left;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .table td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 14px;
            }
            
            .table tr:last-child td {
              border-bottom: none;
            }
            
            .table tr:nth-child(even) {
              background: #f8fafc;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .status-paid { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-failed { background: #fee2e2; color: #991b1b; }
            .status-verified { background: #dbeafe; color: #1e40af; }
            .status-rejected { background: #fee2e2; color: #991b1b; }
            .status-active { background: #dcfce7; color: #166534; }
            .status-inactive { background: #f3f4f6; color: #6b7280; }
            
            .amount {
              font-weight: 600;
              color: #059669;
            }
            
            .chart-container {
              background: #f8fafc;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            
            .summary-box {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border-left: 4px solid #0ea5e9;
              padding: 20px;
              margin: 20px 0;
              border-radius: 0 8px 8px 0;
            }
            
            .summary-box h4 {
              color: #0c4a6e;
              margin-bottom: 10px;
            }
            
            .two-column {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
            }
            
            @media print {
              .page-break {
                page-break-before: always;
              }
              
              .no-break {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;

      await page.setContent(styledHtml, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: finalOptions.format as any,
        landscape: finalOptions.orientation === 'landscape',
        margin: finalOptions.margin,
        displayHeaderFooter: finalOptions.displayHeaderFooter,
        headerTemplate: finalOptions.headerTemplate,
        footerTemplate: finalOptions.footerTemplate,
        printBackground: finalOptions.printBackground,
        scale: finalOptions.scale
      });

      logger.info('PDF généré avec succès', {
        size: pdf.length,
        options: finalOptions
      });

      return Buffer.from(pdf);
    } catch (error) {
      logger.error('Erreur lors de la génération PDF', { error });
      throw error;
    } finally {
      await page.close();
    }
  }

  public async generateDataExportPDF(data: AdminReportData): Promise<Buffer> {
    const html = this.generateDataExportHTML(data);
    return this.generatePDF(html);
  }

  public async generateFullReportPDF(data: AdminReportData): Promise<Buffer> {
    const html = this.generateFullReportHTML(data);
    return this.generatePDF(html);
  }

  private generateDataExportHTML(data: AdminReportData): string {
    const formatPrice = (centimes: number) => (centimes / 100).toFixed(2) + '€';
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR');
    const getStatusBadge = (status: string) => {
      const statusClass = status.toLowerCase().replace(/[^a-z]/g, '');
      return `<span class="status-badge status-${statusClass}">${status}</span>`;
    };

    return `
      <div class="header">
        <h1>Export des Données MoonSkin</h1>
        <p>Données complètes de la plateforme • CS2 Skin Trading</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Utilisateurs Total</h3>
          <div class="value">${data.stats.totalUsers.toLocaleString('fr-FR')}</div>
        </div>
        <div class="stat-card">
          <h3>Trades Total</h3>
          <div class="value">${data.stats.totalTrades.toLocaleString('fr-FR')}</div>
        </div>
        <div class="stat-card">
          <h3>Volume Total</h3>
          <div class="value">${formatPrice(data.stats.totalVolume)}</div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Trades Récents</h2>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Utilisateur</th>
              <th>Statut</th>
              <th>Montant Brut</th>
              <th>Montant Net</th>
              <th>Date Création</th>
            </tr>
          </thead>
          <tbody>
            ${data.trades.slice(0, 20).map(trade => `
              <tr>
                <td>${trade.id}</td>
                <td>${trade.username}</td>
                <td>${getStatusBadge(trade.status)}</td>
                <td class="amount">${formatPrice(trade.grossCents)}</td>
                <td class="amount">${formatPrice(trade.netCents)}</td>
                <td>${formatDate(trade.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="page-break"></div>

      <div class="section">
        <h2 class="section-title">Utilisateurs</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Nom d'utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>KYC</th>
              <th>Inscription</th>
              <th>Dernière Connexion</th>
            </tr>
          </thead>
          <tbody>
            ${data.users.slice(0, 30).map(user => `
              <tr>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${getStatusBadge(user.role)}</td>
                <td>${getStatusBadge(user.kycStatus)}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td>${user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Jamais'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="page-break"></div>

      <div class="section">
        <h2 class="section-title">Paiements</h2>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Utilisateur</th>
              <th>Méthode</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date Création</th>
              <th>Date Traitement</th>
            </tr>
          </thead>
          <tbody>
            ${data.payouts.map(payout => `
              <tr>
                <td>${payout.id}</td>
                <td>${payout.username}</td>
                <td>${payout.method}</td>
                <td class="amount">${formatPrice(payout.amountCents)}</td>
                <td>${getStatusBadge(payout.status)}</td>
                <td>${formatDate(payout.createdAt)}</td>
                <td>${payout.processedAt ? formatDate(payout.processedAt) : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="page-break"></div>

      <div class="section">
        <h2 class="section-title">Affiliés</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Nom d'utilisateur</th>
              <th>Code</th>
              <th>Référrals</th>
              <th>Commission Totale</th>
              <th>Statut</th>
              <th>Date Création</th>
            </tr>
          </thead>
          <tbody>
            ${data.affiliates.map(affiliate => `
              <tr>
                <td>${affiliate.username}</td>
                <td><strong>${affiliate.code}</strong></td>
                <td>${affiliate.totalReferrals}</td>
                <td class="amount">${formatPrice(affiliate.totalCommissionCents)}</td>
                <td>${getStatusBadge(affiliate.status)}</td>
                <td>${formatDate(affiliate.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateFullReportHTML(data: AdminReportData): string {
    const formatPrice = (centimes: number) => (centimes / 100).toFixed(2) + '€';
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR');
    const getStatusBadge = (status: string) => {
      const statusClass = status.toLowerCase().replace(/[^a-z]/g, '');
      return `<span class="status-badge status-${statusClass}">${status}</span>`;
    };

    return `
      <div class="header">
        <h1>Rapport Complet MoonSkin</h1>
        <p>Analyse détaillée de la plateforme • CS2 Skin Trading</p>
      </div>

      <div class="summary-box">
        <h4>Résumé Exécutif</h4>
        <p>Ce rapport présente une vue d'ensemble complète de l'activité de la plateforme MoonSkin pour la période analysée. 
        Il inclut les métriques clés, l'analyse des performances et les recommandations stratégiques.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Utilisateurs Actifs</h3>
          <div class="value">${data.stats.totalUsers.toLocaleString('fr-FR')}</div>
        </div>
        <div class="stat-card">
          <h3>Volume Traité</h3>
          <div class="value">${formatPrice(data.stats.totalVolume)}</div>
        </div>
        <div class="stat-card">
          <h3>Commissions Générées</h3>
          <div class="value">${formatPrice(data.stats.totalCommissions)}</div>
        </div>
        <div class="stat-card">
          <h3>Trades Complétés</h3>
          <div class="value">${data.stats.totalTrades.toLocaleString('fr-FR')}</div>
        </div>
        <div class="stat-card">
          <h3>Affiliés Actifs</h3>
          <div class="value">${data.stats.activeAffiliates.toLocaleString('fr-FR')}</div>
        </div>
        <div class="stat-card">
          <h3>KYC en Attente</h3>
          <div class="value">${data.stats.pendingKYC.toLocaleString('fr-FR')}</div>
        </div>
      </div>

      <div class="page-break"></div>

      <div class="section">
        <h2 class="section-title">Analyse des Performances</h2>
        
        <div class="two-column">
          <div>
            <h3>Répartition des Trades par Statut</h3>
            <div class="chart-container">
              ${data.analytics.tradesByStatus.map(item => `
                <div style="margin: 10px 0; text-align: left;">
                  <strong>${item.status}:</strong> ${item.count} trades
                </div>
              `).join('')}
            </div>
          </div>
          
          <div>
            <h3>Répartition des Utilisateurs</h3>
            <div class="chart-container">
              ${data.analytics.usersByRole.map(item => `
                <div style="margin: 10px 0; text-align: left;">
                  <strong>${item.role}:</strong> ${item.count} utilisateurs
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Évolution du Volume</h2>
        <div class="chart-container">
          <h4>Volume des 30 derniers jours</h4>
          ${data.analytics.volumeByDay.slice(-30).map(item => `
            <div style="margin: 5px 0; text-align: left; display: flex; justify-content: space-between;">
              <span>${formatDate(item.date)}</span>
              <span class="amount">${formatPrice(item.volume)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="page-break"></div>

      <div class="section">
        <h2 class="section-title">Top Performers</h2>
        
        <h3>Top 10 Affiliés par Commission</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Nom d'utilisateur</th>
              <th>Code</th>
              <th>Référrals</th>
              <th>Commission Totale</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${data.affiliates
              .sort((a, b) => b.totalCommissionCents - a.totalCommissionCents)
              .slice(0, 10)
              .map((affiliate, index) => `
                <tr>
                  <td><strong>#${index + 1}</strong></td>
                  <td>${affiliate.username}</td>
                  <td><strong>${affiliate.code}</strong></td>
                  <td>${affiliate.totalReferrals}</td>
                  <td class="amount">${formatPrice(affiliate.totalCommissionCents)}</td>
                  <td>${getStatusBadge(affiliate.status)}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>

      <div class="page-break"></div>

      <div class="section">
        <h2 class="section-title">Gestion des Risques</h2>
        
        <h3>Statut KYC</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Statut</th>
              <th>Date Soumission</th>
              <th>Date Révision</th>
            </tr>
          </thead>
          <tbody>
            ${data.kyc.filter(k => k.status !== 'verified').map(kyc => `
              <tr>
                <td>${kyc.username}</td>
                <td>${getStatusBadge(kyc.status)}</td>
                <td>${formatDate(kyc.submittedAt)}</td>
                <td>${kyc.reviewedAt ? formatDate(kyc.reviewedAt) : 'En attente'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Commissions en Attente</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Affilié</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Trade ID</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.commissions.filter(c => c.status === 'PENDING').map(commission => `
              <tr>
                <td>${commission.affiliateUsername}</td>
                <td class="amount">${formatPrice(commission.amountCents)}</td>
                <td>${getStatusBadge(commission.status)}</td>
                <td>${commission.referralId}</td>
                <td>${formatDate(commission.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="page-break"></div>

      <div class="section">
        <h2 class="section-title">Recommandations</h2>
        <div class="summary-box">
          <h4>Actions Prioritaires</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Traiter les ${data.stats.pendingKYC} demandes KYC en attente</li>
            <li>Valider les commissions d'affiliation en attente (${data.commissions.filter(c => c.status === 'PENDING').length} commissions)</li>
            <li>Surveiller les trades avec statut "échoué" pour identifier les problèmes récurrents</li>
            <li>Optimiser le processus d'onboarding pour réduire le temps de vérification KYC</li>
          </ul>
        </div>
      </div>

      <div class="summary-box">
        <h4>Métriques de Performance</h4>
        <p><strong>Taux de conversion:</strong> ${((data.stats.totalTrades / data.stats.totalUsers) * 100).toFixed(1)}% des utilisateurs ont effectué au moins un trade</p>
        <p><strong>Volume moyen par trade:</strong> ${formatPrice(data.stats.totalVolume / data.stats.totalTrades)}</p>
        <p><strong>Commission moyenne par affilié:</strong> ${formatPrice(data.stats.totalCommissions / data.stats.activeAffiliates)}</p>
      </div>
    `;
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('PDF Generator fermé');
    }
  }
}

export const pdfGenerator = PDFGenerator.getInstance();
