#!/usr/bin/env tsx

/**
 * Script de test de connexion Flexify
 * 
 * Ce script teste la connexion à l'API Flexify et vérifie que:
 * - Les clés API sont valides
 * - La signature HMAC est correcte
 * - L'IP est whitelistée
 * 
 * Usage: npx tsx scripts/test-flexify-connection.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import crypto from 'crypto';

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const CONFIG = {
  apiKey: process.env.FLEXIFY_API_KEY || '',
  apiSecret: process.env.FLEXIFY_API_SECRET || '',
  merchantIdentifier: process.env.FLEXIFY_MERCHANT_IDENTIFIER || '',
  h2hBaseUrl: process.env.FLEXIFY_H2H_URL || 'https://h2h.flexify.finance',
  reportingBaseUrl: process.env.FLEXIFY_API_URL || 'https://api.flexify.finance',
};

function generateDigest(body: string): string {
  const hash = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
  return `SHA-256=${hash}`;
}

function buildSignaturePayload(
  host: string,
  method: string,
  digest?: string,
  contentLength?: number,
  date?: string
): string {
  const parts: string[] = [];
  
  parts.push(`host: ${host}`);
  
  if (method === 'POST' && digest && contentLength !== undefined) {
    parts.push(`digest: ${digest}`);
    parts.push(`content-length: ${contentLength}`);
  }
  
  if (date) {
    parts.push(`date: ${date}`);
  }
  
  return parts.join('');
}

function generateSignature(payload: string): string {
  return crypto
    .createHmac('sha256', CONFIG.apiSecret)
    .update(payload)
    .digest('base64');
}

async function testReportingAPI() {
  console.log('\n📊 Test Reporting API...');
  
  try {
    const authHeader = Buffer.from(`${CONFIG.apiKey}:${CONFIG.apiSecret}`).toString('base64');
    
    // Test avec une plage de dates courte
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const url = `${CONFIG.reportingBaseUrl}/v1/report/transaction?` + 
      `merchant_identifier=${CONFIG.merchantIdentifier}&` +
      `created_at_from=${yesterday.toISOString().split('T')[0]}&` +
      `created_at_to=${today.toISOString().split('T')[0]}`;
    
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (response.ok && (!('code' in data) || data.code === 0)) {
      console.log('   ✅ Reporting API: Connexion réussie');
      console.log(`   📊 Transactions trouvées: ${data.transactions?.length || 0}`);
      return true;
    } else {
      console.log('   ❌ Reporting API: Erreur');
      console.log(`   Code: ${data.code || response.status}`);
      console.log(`   Message: ${data.error_message || data.message || 'Unknown'}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Erreur de connexion:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testH2HAPI() {
  console.log('\n🔒 Test H2H API (création payout de test)...');
  
  try {
    const testPayload = {
      method: 'sepa',
      mode: 'initial',
      reference: `TEST-${Date.now()}`,
      currency: 'EUR',
      amount: '10.00',
      customer: {
        identifier: 'test_user',
        email: 'test@example.com',
        country: 'FR',
        ip: '127.0.0.1',
      },
      callback_url: 'https://example.com/callback',
      sepa: {
        iban: 'FR7630006000011234567890189',
        bic: 'BNPAFRPP',
        holder_name: 'Test User',
      },
    };
    
    const bodyString = JSON.stringify(testPayload);
    const url = `${CONFIG.h2hBaseUrl}/v1/payout`;
    const host = new URL(CONFIG.h2hBaseUrl).host;
    const date = new Date().toUTCString();
    const digest = generateDigest(bodyString);
    const contentLength = Buffer.byteLength(bodyString, 'utf8');
    
    const signaturePayload = buildSignaturePayload(host, 'POST', digest, contentLength, date);
    const signature = generateSignature(signaturePayload);
    
    console.log(`   URL: ${url}`);
    console.log(`   Reference: ${testPayload.reference}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Date': date,
        'Host': host,
        'Digest': digest,
        'Content-Length': contentLength.toString(),
        'Authorization': `Signature keyId="${CONFIG.apiKey}", algorithm="HmacSHA256", headers="host digest content-length date", signature="${signature}"`,
      },
      body: bodyString,
    });
    
    const data = await response.json();
    
    console.log(`   Status HTTP: ${response.status}`);
    console.log(`   Code Flexify: ${data.code}`);
    
    if (response.ok && data.code === 0) {
      console.log('   ✅ H2H API: Payout test créé avec succès');
      console.log(`   Transaction ID: ${data.transaction?.id}`);
      console.log(`   Status: ${data.transaction?.status}`);
      return true;
    } else {
      console.log('   ❌ H2H API: Erreur');
      console.log(`   Error Code: ${data.error_code}`);
      console.log(`   Message: ${data.error_message || data.message}`);
      
      // Diagnostics spécifiques
      if (data.error_code === 11) {
        console.log('\n   💡 Signature invalide:');
        console.log('      - Vérifiez que FLEXIFY_API_SECRET est correct');
        console.log('      - Vérifiez que la date est au bon format');
      } else if (data.error_code === 500) {
        console.log('\n   💡 Fonds insuffisants sur le compte Flexify');
      } else if (data.error_code === 1054) {
        console.log('\n   💡 Méthode SEPA non configurée sur votre compte');
      } else if (response.status === 403) {
        console.log('\n   💡 IP non whitelistée:');
        console.log('      - Contactez le support Flexify pour ajouter votre IP');
      }
      
      return false;
    }
  } catch (error) {
    console.log('   ❌ Erreur de connexion:', error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message.includes('ENOTFOUND')) {
      console.log('\n   💡 DNS résolution échouée:');
      console.log('      - Vérifiez votre connexion internet');
      console.log('      - Vérifiez que FLEXIFY_H2H_URL est correct');
    }
    
    return false;
  }
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test de connexion Flexify');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Vérifications préalables
  if (!CONFIG.apiKey || !CONFIG.apiSecret || !CONFIG.merchantIdentifier) {
    console.log('\n❌ Configuration manquante');
    console.log('   Exécutez d\'abord: npx tsx scripts/check-flexify-config.ts\n');
    process.exit(1);
  }
  
  console.log('\n📋 Configuration:');
  console.log(`   Environment: ${process.env.FLEXIFY_ENVIRONMENT || 'sandbox'}`);
  console.log(`   Merchant ID: ${CONFIG.merchantIdentifier}`);
  console.log(`   API Key: ${CONFIG.apiKey.substring(0, 10)}...`);
  console.log(`   H2H URL: ${CONFIG.h2hBaseUrl}`);
  console.log(`   Reporting URL: ${CONFIG.reportingBaseUrl}`);
  
  // Tests
  const reportingOk = await testReportingAPI();
  const h2hOk = await testH2HAPI();
  
  // Résumé
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Résumé des tests:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Reporting API: ${reportingOk ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`   H2H API:       ${h2hOk ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (reportingOk && h2hOk) {
    console.log('🎉 Tous les tests passent! L\'intégration Flexify est fonctionnelle.\n');
    console.log('Prochaines étapes:');
    console.log('1. Configurer l\'URL de webhook dans le portail Flexify');
    console.log('2. Tester un payout réel via l\'interface web');
    console.log('3. Vérifier la réception des webhooks\n');
  } else {
    console.log('❌ Des erreurs ont été détectées.\n');
    console.log('Actions recommandées:');
    console.log('1. Vérifier la configuration avec: npx tsx scripts/check-flexify-config.ts');
    console.log('2. Contacter le support Flexify si le problème persiste');
    console.log('3. Consulter la documentation: ./FLEXIFY_INTEGRATION.md\n');
  }
  
  process.exit(reportingOk && h2hOk ? 0 : 1);
}

main().catch((error) => {
  console.error('\n💥 Erreur fatale:', error);
  process.exit(1);
});
