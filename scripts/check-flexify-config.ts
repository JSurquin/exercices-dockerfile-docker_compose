#!/usr/bin/env tsx

/**
 * Script de vérification de la configuration Flexify
 * 
 * Usage: npx tsx scripts/check-flexify-config.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

interface CheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, value: string | undefined, required: boolean = true): void {
  if (!value) {
    results.push({
      name,
      status: required ? 'error' : 'warning',
      message: required ? '❌ MANQUANT (requis)' : '⚠️  Non configuré (optionnel)',
    });
  } else if (value.includes('your-') || value.includes('test_') || value === 'MR_TEST') {
    results.push({
      name,
      status: value === 'MR_TEST' ? 'warning' : 'error',
      message: value === 'MR_TEST' 
        ? '⚠️  Valeur de test (sandbox)' 
        : '❌ Valeur placeholder - À remplacer',
    });
  } else {
    results.push({
      name,
      status: 'ok',
      message: '✅ Configuré',
    });
  }
}

console.log('\n🔍 Vérification de la configuration Flexify...\n');

// Vérifications obligatoires
check('FLEXIFY_API_KEY', process.env.FLEXIFY_API_KEY);
check('FLEXIFY_API_SECRET', process.env.FLEXIFY_API_SECRET);
check('FLEXIFY_MERCHANT_IDENTIFIER', process.env.FLEXIFY_MERCHANT_IDENTIFIER);

// Vérifications des URLs
check('FLEXIFY_H2H_URL', process.env.FLEXIFY_H2H_URL);
check('FLEXIFY_API_URL', process.env.FLEXIFY_API_URL);
check('FLEXIFY_ENVIRONMENT', process.env.FLEXIFY_ENVIRONMENT);

// Vérifications des callbacks
check('FLEXIFY_CALLBACK_URL', process.env.FLEXIFY_CALLBACK_URL);
check('FLEXIFY_SUCCESS_URL', process.env.FLEXIFY_SUCCESS_URL, false);
check('FLEXIFY_FAILURE_URL', process.env.FLEXIFY_FAILURE_URL, false);

// Affichage des résultats
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

for (const result of results) {
  console.log(`${result.name.padEnd(30)} ${result.message}`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Statistiques
const errors = results.filter(r => r.status === 'error').length;
const warnings = results.filter(r => r.status === 'warning').length;
const ok = results.filter(r => r.status === 'ok').length;

console.log(`Résultats: ${ok} OK | ${warnings} avertissements | ${errors} erreurs\n`);

// Conseils
if (errors > 0) {
  console.log('⚠️  ERREURS DÉTECTÉES\n');
  console.log('Actions requises:');
  console.log('1. Créer un compte sur https://my.flexify.finance');
  console.log('2. Récupérer vos clés API dans la section "Projects"');
  console.log('3. Copier .env.example vers .env.local');
  console.log('4. Remplacer les valeurs placeholder par vos vraies clés');
  console.log('5. Relancer ce script pour vérifier\n');
}

if (warnings > 0 && errors === 0) {
  console.log('⚠️  Configuration partielle\n');
  console.log('Vous utilisez des valeurs de test. C\'est OK pour le développement,');
  console.log('mais pensez à configurer les vraies clés pour la production.\n');
}

if (errors === 0 && warnings === 0) {
  console.log('✅ Configuration complète!\n');
  console.log('Prochaines étapes:');
  console.log('1. Vérifier que votre IP est whitelistée chez Flexify');
  console.log('2. Tester l\'intégration avec: npx tsx scripts/test-flexify-connection.ts');
  console.log('3. Configurer les webhooks dans le portail Flexify\n');
}

// Informations supplémentaires
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📚 Ressources:');
console.log('- Documentation: ./FLEXIFY_INTEGRATION.md');
console.log('- Spec API: ./.flexify.md');
console.log('- Portail: https://my.flexify.finance');
console.log('- Support: contact@flexify.finance\n');

// Exit code
process.exit(errors > 0 ? 1 : 0);
