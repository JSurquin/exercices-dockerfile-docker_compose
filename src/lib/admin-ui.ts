import { cn } from '@/lib/utils';

/** Glass card — stats, panels, table wrappers */
export const adminGlassCard =
  'admin-glass-card rounded-xl border text-card-foreground shadow-sm';

/** Stat tile on dashboard overview */
export const adminStatCard = cn(adminGlassCard, 'transition-all duration-300 hover:brightness-[1.03]');

/** Curseur clic — éléments interactifs admin (Tailwind v4 ne met plus pointer sur <button> par défaut) */
export const adminInteractive = 'cursor-pointer disabled:cursor-not-allowed';

/** Sidebar / nav */
export const adminNavItem = cn(
  adminInteractive,
  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all duration-200 hover:bg-theme-accent/8 hover:text-foreground'
);

export const adminNavItemActive =
  'bg-theme-accent/12 text-theme-highlight border border-theme-accent/20 shadow-[0_0_20px_var(--cta-shadow)]';

export const adminNavIcon = 'h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-theme-accent';
export const adminNavIconActive = 'h-5 w-5 flex-shrink-0 text-theme-accent';

/** Counter badge (KYC, payouts, etc.) */
export const adminBadgeCount =
  'admin-badge-count ml-auto h-5 min-w-5 px-1.5 text-xs font-medium tabular-nums';

/** Status badges — pending, active, etc. */
export const adminBadgeStatus =
  'admin-badge-status border text-xs font-medium';

/** Table */
export const adminTableCard = cn(adminGlassCard, 'overflow-hidden py-0 gap-0');
export const adminTableHead = 'admin-table-head whitespace-nowrap';
export const adminTableRow = 'admin-table-row';
export const adminTableCell = 'admin-table-cell';

/** Icons in stat / section headers */
export const adminIconAccent = 'h-4 w-4 text-theme-accent shrink-0';
export const adminIconAccentLg = 'h-5 w-5 text-theme-accent shrink-0';

/** Primary action button */
export const adminBtnPrimary = cn(
  adminInteractive,
  'btn-cta rounded-md font-medium text-white shadow-md hover:brightness-110'
);

/** Tabs / triggers actifs */
export const adminTabActive = cn(
  adminInteractive,
  'data-[state=active]:bg-cta-gradient data-[state=active]:text-white data-[state=active]:shadow-md'
);

/** Secondary / visit-style */
export const adminBtnOutline = cn(
  adminInteractive,
  'border-theme-accent/30 bg-background/30 text-theme-accent hover:bg-theme-accent/10 hover:text-theme-accent hover:border-theme-accent/40'
);

/** Inputs / selects in dark panels */
export const panelGlassField =
  'bg-background/30 border-border/50 text-foreground backdrop-blur-sm focus-visible:border-theme-accent/40 focus-visible:ring-theme-accent/20';

/** Dialog Radix (porté hors .admin-shell) — aligné sur admin-panel.css */
export const adminDialogContent =
  'admin-dialog max-h-[90vh] w-full max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-3xl';

/** Dialog avec en-tête fixe + zone scrollable interne (évite double scroll) */
export const adminDialogContentFixed =
  'admin-dialog flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl';

export const adminDialogContentSm =
  'admin-dialog max-w-md';

/** Tuile stat dans un dialog admin */
export const adminDialogStatTile =
  'admin-dialog-stat rounded-lg border p-4 text-center';

/** Conversation list row */
export const panelListRow = cn(
  adminInteractive,
  'rounded-lg border border-border/40 bg-background/20 p-3 sm:p-4 hover:border-theme-accent/25 hover:bg-theme-accent/5 transition-colors backdrop-blur-sm'
);
