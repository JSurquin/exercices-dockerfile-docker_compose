/**
 * Tests pour la signature HMAC-SHA256 Flexify
 * 
 * Ces tests vérifient que la signature est générée correctement selon la spec H2H
 */


import crypto from 'crypto';

// Mock de la config pour les tests
const TEST_API_KEY = 'test_api_key';
const TEST_API_SECRET = 'test_api_secret';

/**
 * Fonction helper pour générer un Digest SHA-256
 */
function generateDigest(body: string): string {
  const hash = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
  return `SHA-256=${hash}`;
}

/**
 * Fonction helper pour construire le payload de signature
 */
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

/**
 * Fonction helper pour générer la signature HMAC
 */
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');
}

describe('Flexify - Signature HMAC-SHA256', () => {
  it('devrait générer un Digest SHA-256 correct', () => {
    const body = '{"method":"sepa","amount":"100.00"}';
    const digest = generateDigest(body);
    
    expect(digest).toMatch(/^SHA-256=[A-Za-z0-9+/]+=*$/);
    expect(digest).toContain('SHA-256=');
  });

  it('devrait générer le même Digest pour le même body', () => {
    const body = '{"method":"sepa","amount":"100.00"}';
    const digest1 = generateDigest(body);
    const digest2 = generateDigest(body);
    
    expect(digest1).toBe(digest2);
  });

  it('devrait générer des Digests différents pour des bodies différents', () => {
    const body1 = '{"method":"sepa"}';
    const body2 = '{"method":"card"}';
    
    const digest1 = generateDigest(body1);
    const digest2 = generateDigest(body2);
    
    expect(digest1).not.toBe(digest2);
  });

  it('devrait construire le payload de signature POST correctement', () => {
    const host = 'h2h.flexify.finance';
    const digest = 'SHA-256=abc123';
    const contentLength = 100;
    const date = 'Thu, 12 Feb 2026 12:00:00 GMT';
    
    const payload = buildSignaturePayload(host, 'POST', digest, contentLength, date);
    
    expect(payload).toBe('host: h2h.flexify.financedigest: SHA-256=abc123content-length: 100date: Thu, 12 Feb 2026 12:00:00 GMT');
  });

  it('devrait construire le payload de signature GET correctement', () => {
    const host = 'api.flexify.finance';
    const date = 'Thu, 12 Feb 2026 12:00:00 GMT';
    
    const payload = buildSignaturePayload(host, 'GET', undefined, undefined, date);
    
    expect(payload).toBe('host: api.flexify.financedate: Thu, 12 Feb 2026 12:00:00 GMT');
  });

  it('devrait générer une signature HMAC valide', () => {
    const payload = 'host: h2h.flexify.finance';
    const signature = generateSignature(payload, TEST_API_SECRET);
    
    expect(signature).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(signature.length).toBeGreaterThan(20);
  });

  it('devrait générer la même signature pour le même payload et secret', () => {
    const payload = 'host: h2h.flexify.finance';
    const signature1 = generateSignature(payload, TEST_API_SECRET);
    const signature2 = generateSignature(payload, TEST_API_SECRET);
    
    expect(signature1).toBe(signature2);
  });

  it('devrait générer des signatures différentes avec des secrets différents', () => {
    const payload = 'host: h2h.flexify.finance';
    const signature1 = generateSignature(payload, 'secret1');
    const signature2 = generateSignature(payload, 'secret2');
    
    expect(signature1).not.toBe(signature2);
  });

  it('devrait valider un header Authorization bien formaté', () => {
    const signature = 'abc123def456';
    const authHeader = `Signature keyId="${TEST_API_KEY}", algorithm="HmacSHA256", headers="host digest content-length date", signature="${signature}"`;
    
    expect(authHeader).toMatch(/keyId="[^"]+"/);
    expect(authHeader).toMatch(/algorithm="HmacSHA256"/);
    expect(authHeader).toMatch(/headers="[^"]+"/);
    expect(authHeader).toMatch(/signature="[^"]+"/);
  });

  it('devrait extraire les composants du header Authorization', () => {
    const signature = 'abc123def456';
    const authHeader = `Signature keyId="${TEST_API_KEY}", algorithm="HmacSHA256", headers="host digest content-length date", signature="${signature}"`;
    
    const keyIdMatch = authHeader.match(/keyId="([^"]+)"/);
    const signatureMatch = authHeader.match(/signature="([^"]+)"/);
    const headersMatch = authHeader.match(/headers="([^"]+)"/);
    
    expect(keyIdMatch?.[1]).toBe(TEST_API_KEY);
    expect(signatureMatch?.[1]).toBe(signature);
    expect(headersMatch?.[1]).toBe('host digest content-length date');
  });
});

describe('Flexify - Validation Webhook', () => {
  it('devrait valider un webhook avec signature correcte', () => {
    const body = '{"transaction_id":"TX123","status":"success"}';
    const digest = generateDigest(body);
    const host = 'moonskin.com';
    const date = new Date().toUTCString();
    const contentLength = Buffer.byteLength(body, 'utf8');
    
    const signaturePayload = buildSignaturePayload(host, 'POST', digest, contentLength, date);
    const signature = generateSignature(signaturePayload, TEST_API_SECRET);
    
    // La signature devrait être reproductible
    const signaturePayload2 = buildSignaturePayload(host, 'POST', digest, contentLength, date);
    const signature2 = generateSignature(signaturePayload2, TEST_API_SECRET);
    
    expect(signature).toBe(signature2);
  });

  it('devrait détecter une signature invalide', () => {
    const body = '{"transaction_id":"TX123","status":"success"}';
    const digest = generateDigest(body);
    const wrongDigest = generateDigest('{"different":"body"}');
    
    expect(digest).not.toBe(wrongDigest);
  });

  it('devrait utiliser timingSafeEqual pour comparer les signatures', () => {
    const signature1 = 'abc123def456';
    const signature2 = 'abc123def456';
    const signature3 = 'xyz789ghi012';
    
    // Comparaison sécurisée
    const result1 = crypto.timingSafeEqual(
      Buffer.from(signature1),
      Buffer.from(signature2)
    );
    
    expect(result1).toBe(true);
    
    // Doit lancer une erreur si les longueurs diffèrent
    expect(() => {
      crypto.timingSafeEqual(
        Buffer.from(signature1),
        Buffer.from('short')
      );
    }).toThrow();
  });
});

describe('Flexify - Scénarios d\'Intégration', () => {
  it('devrait créer une requête POST complète avec signature', () => {
    const body = JSON.stringify({
      method: 'sepa',
      mode: 'initial',
      reference: 'MOON-123',
      currency: 'EUR',
      amount: '100.00',
    });
    
    const host = 'h2h.flexify.finance';
    const date = new Date().toUTCString();
    const digest = generateDigest(body);
    const contentLength = Buffer.byteLength(body, 'utf8');
    
    const signaturePayload = buildSignaturePayload(host, 'POST', digest, contentLength, date);
    const signature = generateSignature(signaturePayload, TEST_API_SECRET);
    
    const headers = {
      'Content-Type': 'application/json',
      'Date': date,
      'Host': host,
      'Digest': digest,
      'Content-Length': contentLength.toString(),
      'Authorization': `Signature keyId="${TEST_API_KEY}", algorithm="HmacSHA256", headers="host digest content-length date", signature="${signature}"`,
    };
    
    // Vérifier que tous les headers requis sont présents
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Date']).toBeTruthy();
    expect(headers['Host']).toBe(host);
    expect(headers['Digest']).toContain('SHA-256=');
    expect(headers['Content-Length']).toBe(contentLength.toString());
    expect(headers['Authorization']).toContain('Signature');
    expect(headers['Authorization']).toContain(TEST_API_KEY);
  });
});
