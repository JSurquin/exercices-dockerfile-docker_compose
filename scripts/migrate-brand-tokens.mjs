#!/usr/bin/env node
/**
 * One-shot migration: orange/amber brand utilities → theme tokens.
 * Run: node scripts/migrate-brand-tokens.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

const REPLACEMENTS = [
  // Gradients (longest first)
  [
    "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700",
    "bg-cta-gradient hover:brightness-110",
  ],
  [
    "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white",
    "bg-cta-gradient hover:brightness-110 text-white",
  ],
  [
    "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
    "bg-cta-gradient hover:brightness-110",
  ],
  [
    "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600",
    "bg-cta-gradient hover:brightness-110",
  ],
  [
    "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
    "bg-cta-gradient hover:brightness-110",
  ],
  [
    "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600",
    "bg-cta-gradient-br",
  ],
  [
    "bg-gradient-to-br from-orange-500 to-red-600",
    "bg-cta-gradient-br",
  ],
  [
    "bg-gradient-to-r from-orange-500 to-red-600",
    "bg-cta-gradient",
  ],
  [
    "bg-gradient-to-r from-orange-500 to-red-500",
    "bg-cta-gradient",
  ],
  [
    "bg-gradient-to-r from-orange-500 to-orange-600",
    "bg-cta-gradient",
  ],
  [
    "bg-gradient-to-br from-orange-500 to-orange-600",
    "bg-cta-gradient-br",
  ],
  [
    "bg-gradient-to-br from-orange-500/5 via-card to-red-500/5 border-orange-500/20",
    "bg-gradient-to-br from-theme-accent/5 via-card to-theme-accent/10 border-theme-accent/20",
  ],
  [
    "bg-gradient-to-r from-orange-500/20 via-transparent to-red-500/20",
    "bg-gradient-to-r from-theme-accent/20 via-transparent to-theme-accent/10",
  ],
  [
    "bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-red-500/10",
    "bg-gradient-to-br from-theme-accent/10 via-theme-accent/5 to-theme-accent/10",
  ],
  [
    "bg-gradient-to-br from-orange-500/10 via-transparent to-red-900",
    "bg-gradient-to-br from-theme-accent/10 via-transparent to-background",
  ],
  [
    "bg-gradient-to-r from-orange-500/5 to-red-500/5",
    "bg-gradient-to-r from-theme-accent/5 to-theme-accent/10",
  ],
  [
    "bg-gradient-to-r from-orange-500/20 to-orange-600/20",
    "bg-gradient-to-r from-theme-accent/20 to-theme-accent/30",
  ],
  [
    "bg-gradient-to-br from-orange-500/10 to-blue-500/10",
    "bg-gradient-to-br from-theme-accent/10 to-primary/10",
  ],
  [
    "bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-red-500/10",
    "bg-gradient-to-br from-theme-accent/10 via-theme-accent/5 to-theme-accent/10",
  ],
  [
    "bg-gradient-to-br from-yellow-500/10 via-card to-orange-500/10 border-yellow-500/30",
    "bg-gradient-to-br from-theme-highlight/10 via-card to-theme-accent/10 border-theme-highlight/30",
  ],
  [
    "bg-gradient-to-br from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20",
    "bg-gradient-to-br from-theme-accent/10 to-theme-accent/15 hover:from-theme-accent/20 hover:to-theme-accent/25",
  ],
  [
    "bg-gradient-to-r from-orange-50/60 to-amber-50/60 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800",
    "bg-gradient-to-r from-theme-accent/5 to-theme-highlight/5 dark:from-theme-accent/10 dark:to-theme-highlight/10 border-theme-accent/20 dark:border-theme-accent/30",
  ],
  [
    "bg-gradient-to-r from-yellow-50/60 to-amber-50/60 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-300 dark:border-yellow-700",
    "bg-gradient-to-r from-theme-highlight/5 to-theme-highlight/10 dark:from-theme-highlight/10 dark:to-theme-highlight/15 border-theme-highlight/30 dark:border-theme-highlight/40",
  ],
  // Buttons
  ["bg-orange-500 hover:bg-orange-600 text-white", "bg-primary hover:bg-primary/90 text-primary-foreground"],
  ["bg-orange-500 hover:bg-orange-600", "bg-primary hover:bg-primary/90"],
  ["bg-orange-600 hover:bg-orange-700 text-white", "bg-primary hover:bg-primary/90 text-primary-foreground"],
  ["bg-orange-600 hover:bg-orange-700", "bg-primary hover:bg-primary/90"],
  ["w-full bg-orange-500 hover:bg-orange-600", "w-full bg-primary hover:bg-primary/90"],
  ["? 'bg-orange-500 hover:bg-orange-600 text-white'", "? 'bg-primary hover:bg-primary/90 text-primary-foreground'"],
  // Steps / rings
  ["bg-orange-500 border-orange-500 text-white", "bg-primary border-primary text-primary-foreground"],
  ["group-hover:bg-orange-600 group-hover:border-orange-600", "group-hover:bg-primary/90 group-hover:border-primary/90"],
  ["group-hover:text-orange-600 dark:group-hover:text-orange-400", "group-hover:text-theme-accent"],
  ["focus-visible:ring-orange-500", "focus-visible:ring-primary"],
  ["index < currentStep ? \"bg-orange-500\" : \"bg-muted\"", "index < currentStep ? \"bg-primary\" : \"bg-muted\""],
  ["? \"bg-orange-500\" : \"bg-muted\"", "? \"bg-primary\" : \"bg-muted\""],
  // Panels
  ["border-orange-500/30 bg-orange-500/5", "brand-panel"],
  ["border-orange-500/40 bg-orange-500/5", "border-theme-accent/40 bg-theme-accent/5"],
  ["border border-orange-500/30 bg-orange-500/5", "brand-panel"],
  ["border border-orange-500/40 bg-orange-500/5", "border-theme-accent/40 bg-theme-accent/5"],
  ["bg-orange-500/10 border border-orange-500/30", "bg-theme-accent/10 border border-theme-accent/30"],
  ["border border-orange-500/20", "border border-theme-accent/20"],
  ["border-2 border-orange-500/40", "border-2 border-theme-accent/40"],
  ["bg-orange-500/15", "bg-theme-accent/15"],
  ["bg-orange-500/20", "bg-theme-accent/20"],
  ["bg-orange-100 dark:bg-orange-900", "bg-theme-accent/15 dark:bg-theme-accent/25"],
  ["bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800", "bg-theme-accent/5 dark:bg-theme-accent/10 border border-theme-accent/20 dark:border-theme-accent/30"],
  // Text
  ["text-orange-700 dark:text-orange-300", "text-theme-accent"],
  ["text-orange-600 dark:text-orange-400", "text-theme-highlight"],
  ["dark:text-orange-400", "dark:text-theme-highlight"],
  ["text-orange-800", "text-theme-accent"],
  ["text-orange-700", "text-theme-accent"],
  ["text-orange-600", "text-theme-accent"],
  ["text-orange-500", "text-theme-accent"],
  ["text-orange-400", "text-theme-highlight"],
  ["hover:text-orange-600", "hover:text-theme-accent"],
  ["hover:text-orange-500", "hover:text-theme-accent"],
  ["underline text-orange-500 hover:text-orange-600", "underline text-theme-accent hover:text-theme-accent/80"],
  // Amber → highlight/stat
  ["border-amber-500/30 bg-amber-500/5", "border-theme-highlight/30 bg-theme-highlight/5"],
  ["border-amber-500/40 bg-amber-500/10", "border-theme-highlight/40 bg-theme-highlight/10"],
  ["border border-amber-500/40 bg-amber-500/10", "border border-theme-highlight/40 bg-theme-highlight/10"],
  ["border border-amber-500/30 bg-amber-500/5", "border-theme-highlight/30 bg-theme-highlight/5"],
  ["border-amber-500/30", "border-theme-highlight/30"],
  ["text-amber-700 dark:text-amber-300", "text-theme-highlight"],
  ["text-amber-600 dark:text-amber-400", "text-theme-highlight"],
  ["text-amber-400", "text-theme-highlight"],
  ["text-amber-500", "text-theme-stat"],
  ["text-amber-600", "text-theme-stat"],
  ["text-amber-700", "text-theme-highlight"],
  ["bg-amber-500", "bg-theme-stat"],
  ["bg-amber-400", "bg-theme-highlight"],
  ["bg-amber-500/20 text-amber-600 dark:text-amber-400", "bg-theme-highlight/20 text-theme-highlight"],
  ["bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/30", "bg-theme-highlight/15 text-theme-highlight border border-theme-highlight/30"],
  ["bg-amber-400/20 text-amber-500 border border-amber-400/40", "bg-theme-highlight/20 text-theme-stat border border-theme-highlight/40"],
  ["border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/20", "brand-panel-dashed"],
  ["border border-dashed border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/20", "brand-panel-dashed"],
  ["border-amber-200 dark:border-amber-800", "border-theme-highlight/25 dark:border-theme-highlight/35"],
  ["border-amber-300/60 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/40", "border-theme-highlight/30 bg-theme-highlight/10 dark:bg-theme-highlight/15"],
  ["hover:bg-amber-100 dark:hover:bg-amber-900/50", "hover:bg-theme-highlight/15 dark:hover:bg-theme-highlight/20"],
  ["bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800", "bg-theme-highlight/5 dark:bg-theme-highlight/10 border border-theme-highlight/25 dark:border-theme-highlight/35"],
  ["bg-amber-100 dark:bg-amber-900/30", "bg-theme-highlight/15 dark:bg-theme-highlight/20"],
  ["shadow-orange-500/20", "shadow-[var(--cta-shadow)]"],
  ["shadow-orange-500/30", "shadow-[var(--cta-shadow)]"],
  ["shadow-lg shadow-orange-500/50", "shadow-lg shadow-[var(--cta-shadow)]"],
  ["shadow-orange-500/10", "shadow-[var(--cta-shadow)]"],
  ["border-orange-500/50", "border-theme-accent/50"],
  ["border-orange-600", "border-primary"],
  ["border-b-2 border-orange-600", "border-b-2 border-primary"],
  ["bg-orange-500/20 text-orange-600 dark:text-orange-400", "bg-theme-accent/20 text-theme-highlight"],
  ["bg-orange-500/20", "bg-theme-accent/20"],
  ["animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600", "animate-spin rounded-full h-8 w-8 border-b-2 border-primary"],
  ["border-b-2 border-orange-500", "border-b-2 border-primary"],
  ["[&>div]:bg-amber-500", "[&>div]:bg-theme-stat"],
  ["bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30", "bg-theme-highlight/20 text-theme-highlight border-theme-highlight/30"],
  [
    "from-orange-500 via-transparent to-red-900",
    "from-theme-accent/15 via-transparent to-background",
  ],
  ["to-orange-900/40", "to-background/40"],
  ["via-orange-500 to-transparent", "via-theme-accent/20 to-transparent"],
  ["from-orange-500/10 via-orange-600/5 to-red-500/10", "from-theme-accent/10 via-theme-accent/5 to-theme-accent/10"],
  ["hover:border-orange-500/40", "hover:border-theme-accent/40"],
  ["hover:from-orange-500/20 hover:to-red-500/20", "hover:from-theme-accent/20 hover:to-theme-accent/25"],
  ["border-orange-500/20 hover:border-orange-500/40", "border-theme-accent/20 hover:border-theme-accent/40"],
  ["text-orange-500 group-hover:text-orange-400", "text-theme-accent group-hover:text-theme-highlight"],
  ["bg-orange-500 text-white rounded-tr-sm", "bg-primary text-primary-foreground rounded-tr-sm"],
  ["? 'bg-orange-500 text-white rounded-tr-sm'", "? 'bg-primary text-primary-foreground rounded-tr-sm'"],
  // Second pass
  ["border-orange-500/30", "border-theme-accent/30"],
  ["border-orange-500/20", "border-theme-accent/20"],
  ["border-orange-500/25", "border-theme-accent/25"],
  ["border-orange-500/40", "border-theme-accent/40"],
  ["border-orange-500/50", "border-theme-accent/50"],
  ["border-orange-500/60", "border-theme-accent/40"],
  ["border-orange-500", "border-theme-accent"],
  ["border-orange-200 dark:border-orange-800", "border-theme-accent/20 dark:border-theme-accent/30"],
  ["border-orange-300", "border-theme-accent/30"],
  ["hover:border-orange-300", "hover:border-theme-accent/30"],
  ["hover:border-orange-500/60", "hover:border-theme-accent/50"],
  ["hover:border-orange-500/30", "hover:border-theme-accent/30"],
  ["hover:border-orange-400", "hover:border-theme-highlight"],
  ["hover:border-orange-500/60", "hover:border-theme-accent/40"],
  ["hover:bg-orange-50 dark:hover:bg-orange-950/30", "hover:bg-theme-accent/5 dark:hover:bg-theme-accent/10"],
  ["hover:bg-orange-50 dark:hover:bg-orange-950", "hover:bg-theme-accent/5 dark:hover:bg-theme-accent/10"],
  ["bg-orange-50 dark:bg-orange-950", "bg-theme-accent/5 dark:bg-theme-accent/10"],
  ["bg-orange-50 dark:bg-orange-950/20", "bg-theme-accent/5 dark:bg-theme-accent/10"],
  ["bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800", "bg-theme-accent/5 dark:bg-theme-accent/10 border border-theme-accent/20 dark:border-theme-accent/30"],
  ["bg-orange-500/10", "bg-theme-accent/10"],
  ["bg-orange-500/[0.06] dark:bg-orange-950/20", "bg-theme-accent/5 dark:bg-theme-accent/10"],
  ["bg-orange-500 text-white", "bg-primary text-primary-foreground"],
  ["bg-orange-500", "bg-primary"],
  ["ring-2 ring-orange-500", "ring-2 ring-primary"],
  ["ring-2 ring-orange-500/50", "ring-2 ring-primary/50"],
  ["ring-2 ring-orange-500/60", "ring-primary/50"],
  ["ring-orange-500", "ring-primary"],
  ["focus:ring-orange-400", "focus:ring-primary"],
  ["focus:border-orange-500", "focus:border-primary"],
  ["border-orange-500 bg-orange-500/10", "border-theme-accent bg-theme-accent/10"],
  ["border-l-4 border-orange-500", "border-l-4 border-theme-accent"],
  ["text-orange-900 dark:text-orange-100", "text-foreground"],
  ["dark:text-orange-200", "dark:text-theme-highlight"],
  ["text-orange-300", "text-theme-highlight"],
  ["hover:text-orange-300", "hover:text-theme-highlight"],
  ["hover:bg-orange-900/30 hover:text-orange-300", "hover:bg-theme-accent/15 hover:text-theme-highlight"],
  ["hover:bg-orange-900/30", "hover:bg-theme-accent/15"],
  ["hover:bg-amber-900/30", "hover:bg-theme-highlight/15"],
  ["border-amber-600", "border-theme-highlight"],
  ["hover:bg-amber-600", "hover:bg-theme-highlight/90"],
  ["bg-amber-600 hover:bg-amber-700", "bg-theme-stat hover:bg-theme-stat/90"],
  ["border-amber-500/40", "border-theme-highlight/40"],
  ["border-amber-400/30", "border-theme-highlight/30"],
  ["border-amber-400/40", "border-theme-highlight/40"],
  ["from-orange-400 to-orange-600", "from-theme-accent to-primary"],
  ["text-orange-300 shadow-lg", "text-theme-highlight shadow-lg"],
  ["data-[state=active]:bg-orange-500", "data-[state=active]:bg-primary"],
  ["hover:shadow-orange-500/40", "hover:shadow-[var(--cta-shadow)]"],
  ["to-orange-500/5", "to-theme-accent/5"],
  ["from-purple-500 to-orange-500", "from-purple-500 to-theme-accent"],
  ["hover:border-orange-500/30", "hover:border-theme-accent/30"],
  ["border-orange-500/40 bg-orange-500/10", "border-theme-accent/40 bg-theme-accent/10"],
  ["ring-orange-500 bg-orange-50 dark:bg-orange-950", "ring-primary bg-theme-accent/5 dark:bg-theme-accent/10"],
  ["border-orange-300 text-theme-accent hover:bg-orange-50 dark:border-orange-700 dark:text-theme-highlight dark:hover:bg-orange-950", "border-theme-accent/30 text-theme-accent hover:bg-theme-accent/5 dark:border-theme-accent/40 dark:text-theme-highlight dark:hover:bg-theme-accent/10"],
  ["bg-orange-100 text-theme-accent dark:bg-orange-900 dark:text-orange-200", "bg-theme-accent/10 text-theme-accent dark:bg-theme-accent/20 dark:text-theme-highlight"],
  ["? 'border-orange-500/20 bg-orange-500/5'", "? 'brand-panel'"],
  ["border-orange-500/20 bg-orange-500/5", "brand-panel"],
  ["dark:hover:bg-orange-950/30", "dark:hover:bg-theme-accent/10"],
  ["group-hover:bg-orange-500/10", "group-hover:bg-theme-accent/10"],
  ["p-2 rounded-lg bg-orange-500/10 group-hover:bg-theme-accent/20", "p-2 rounded-lg bg-theme-accent/10 group-hover:bg-theme-accent/20"],
  ["border-2 border-dashed border-slate-600 hover:border-orange-500/60", "border-2 border-dashed border-slate-600 hover:border-theme-accent/40"],
  ["'paiement_en_cours': 'bg-orange-500'", "'paiement_en_cours': 'bg-primary'"],
  ["low_price:      { label: translateSkipReason(item.skip_reason), className: 'bg-orange-500 text-white' }", "low_price:      { label: translateSkipReason(item.skip_reason), className: 'bg-primary text-primary-foreground' }"],
  ["text-amber-300/80", "text-theme-highlight/80"],
  ["text-amber-200", "text-theme-highlight"],
  ["border-amber-600/50", "border-theme-highlight/50"],
  // Third pass
  ["hover:bg-orange-50 dark:border-orange-700 dark:text-theme-highlight dark:hover:bg-orange-950", "hover:bg-theme-accent/5 dark:border-theme-accent/40 dark:text-theme-highlight dark:hover:bg-theme-accent/10"],
  ["bg-orange-100 text-theme-accent dark:bg-orange-900 dark:text-theme-highlight", "bg-theme-accent/10 text-theme-accent dark:bg-theme-accent/20 dark:text-theme-highlight"],
  ["bg-orange-100 text-theme-accent", "bg-theme-accent/10 text-theme-accent"],
  ["bg-orange-700/60", "bg-primary/60"],
  ["hover:bg-orange-600 hover:text-white", "hover:bg-primary/90 hover:text-white"],
  ["bg-orange-400", "bg-theme-highlight"],
  ["bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20", "bg-gradient-to-r from-theme-accent/5 to-theme-accent/10 dark:from-theme-accent/10 dark:to-theme-accent/15"],
  ["bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20", "bg-gradient-to-br from-theme-accent/5 to-theme-accent/10 dark:from-theme-accent/10 dark:to-theme-accent/15"],
  ["bg-gradient-to-br from-orange-500/20 to-red-600/20", "bg-gradient-to-br from-theme-accent/20 to-theme-accent/30"],
  ["bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent", "bg-gradient-to-br from-theme-accent/10 via-theme-accent/5 to-transparent"],
  ["bg-gradient-to-br from-orange-500/5 to-red-600/5", "bg-gradient-to-br from-theme-accent/5 to-theme-accent/10"],
  ["bg-gradient-to-br from-orange-500/15 to-red-600/15", "bg-gradient-to-br from-theme-accent/15 to-theme-accent/20"],
  ["bg-gradient-to-r from-orange-500/10 to-red-600/10", "bg-gradient-to-r from-theme-accent/10 to-theme-accent/15"],
  ["bg-gradient-to-br from-orange-500/30 to-orange-600/10", "bg-gradient-to-br from-theme-accent/30 to-theme-accent/10"],
  ["bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20", "bg-gradient-to-r from-theme-highlight/5 to-theme-accent/5 dark:from-theme-highlight/10 dark:to-theme-accent/10"],
  ["border-yellow-200 dark:border-yellow-800", "border-theme-highlight/25 dark:border-theme-highlight/35"],
  ["bg-amber-50 dark:bg-amber-950/20", "bg-theme-highlight/5 dark:bg-theme-highlight/10"],
  ["text-amber-900 dark:text-theme-highlight", "text-theme-highlight"],
  ["text-amber-800 dark:text-theme-highlight", "text-theme-highlight"],
  ["border-amber-500/25", "border-theme-highlight/25"],
  ["border-amber-500/20", "border-theme-highlight/20"],
  ["from-amber-500/10 via-amber-500/5 to-emerald-500/10", "from-theme-highlight/10 via-theme-highlight/5 to-emerald-500/10"],
  ["border-orange-700/50 bg-orange-950/30", "border-theme-accent/30 bg-theme-accent/10"],
  ["border-orange-700 bg-orange-950/30", "border-theme-accent/30 bg-theme-accent/10"],
  ["border-amber-700/50 bg-amber-950/30", "border-theme-highlight/30 bg-theme-highlight/10"],
  ["text-amber-300", "text-theme-highlight"],
  ["border-amber-500/50 shadow-lg shadow-amber-500/10", "border-theme-highlight/40 shadow-lg shadow-[var(--cta-shadow)]"],
  ["data-[state=active]:from-orange-500 data-[state=active]:to-orange-600", "data-[state=active]:from-[var(--cta-from)] data-[state=active]:to-[var(--cta-to)]"],
  ["index === 2 ? 'bg-orange-600 text-white'", "index === 2 ? 'bg-primary text-primary-foreground'"],
  ["'bg-orange-100 text-theme-accent'}", "'bg-theme-accent/10 text-theme-accent'}"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (p.endsWith(".tsx") || p.endsWith(".ts")) files.push(p);
  }
  return files;
}

let total = 0;
for (const file of walk(ROOT)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  for (const [from, to] of REPLACEMENTS) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
    }
  }
  if (content !== original) {
    fs.writeFileSync(file, content);
    total++;
    console.log("updated:", path.relative(ROOT, file));
  }
}

console.log(`\n${total} files updated.`);
