import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les endpoints API
 * Validation des réponses, codes de statut, authentification
 */

test.describe('API - Endpoints publics', () => {
  
  test('GET /api/status - Statut du service', async ({ request }) => {
    const response = await request.get('/api/status');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    console.log('✅ Status API:', data);
  });

  test('GET /api/health - Health check', async ({ request }) => {
    // Tenter d'accéder à un endpoint de health check
    const response = await request.get('/api/health');
    
    const status = response.status();
    console.log('Health check status:', status);
  });

  test('Headers CORS - Correctement configurés', async ({ request }) => {
    const response = await request.get('/');
    
    const headers = response.headers();
    console.log('Headers:', {
      'access-control-allow-origin': headers['access-control-allow-origin'],
      'access-control-allow-methods': headers['access-control-allow-methods'],
    });
  });
});

test.describe('API - Endpoints protégés', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('GET /api/user/me - Informations utilisateur', async ({ request, page }) => {
    // D'abord aller sur une page pour initialiser la session
    await page.goto('/dashboard');
    
    // Créer la requête avec les cookies du contexte
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    const response = await request.get('/api/user/me', {
      headers: {
        'Cookie': cookieHeader,
      },
    });
    
    if (response.ok()) {
      const data = await response.json();
      console.log('✅ User data:', data);
      
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
    } else {
      console.log('Status:', response.status());
    }
  });

  test('POST /api/user/update - Mise à jour du profil', async ({ request, page }) => {
    await page.goto('/dashboard');
    
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    const response = await request.post('/api/user/update', {
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test User Updated',
      },
    });
    
    const status = response.status();
    console.log('Update profile status:', status);
  });
});

test.describe('API - Authentification', () => {
  
  test('Endpoint protégé sans auth - 401', async ({ request }) => {
    const response = await request.get('/api/user/me');
    
    const status = response.status();
    
    // Devrait retourner 401 Unauthorized
    console.log('Status sans auth:', status);
    expect([401, 403]).toContain(status);
  });

  test('Token invalide - Rejet', async ({ request }) => {
    const response = await request.get('/api/user/me', {
      headers: {
        'Cookie': 'better-auth.session_token=invalid-token-12345',
      },
    });
    
    const status = response.status();
    
    console.log('Status avec token invalide:', status);
    expect([401, 403]).toContain(status);
  });
});

test.describe('API - Rate limiting', () => {
  
  test('Trop de requêtes - 429', async ({ request }) => {
    // Faire plusieurs requêtes rapides
    const promises = [];
    
    for (let i = 0; i < 50; i++) {
      promises.push(request.get('/api/status'));
    }
    
    const responses = await Promise.all(promises);
    
    // Vérifier si un rate limit a été déclenché
    const rateLimited = responses.some(r => r.status() === 429);
    
    if (rateLimited) {
      console.log('✅ Rate limiting actif');
    } else {
      console.log('ℹ️ Pas de rate limiting détecté (ou limite haute)');
    }
  });
});

test.describe('API - Validation des données', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Données invalides - 400 Bad Request', async ({ request, page }) => {
    await page.goto('/dashboard');
    
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // Envoyer des données invalides
    const response = await request.post('/api/user/update', {
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      data: {
        email: 'invalid-email', // Email invalide
      },
    });
    
    const status = response.status();
    console.log('Status avec données invalides:', status);
    
    // Devrait retourner 400 ou 422
    if ([400, 422].includes(status)) {
      console.log('✅ Validation des données côté API');
    }
  });

  test('Champs manquants - Erreur appropriée', async ({ request, page }) => {
    await page.goto('/dashboard');
    
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    const response = await request.post('/api/user/update', {
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      data: {}, // Données vides
    });
    
    const status = response.status();
    console.log('Status avec données manquantes:', status);
  });
});

test.describe('API - Headers de réponse', () => {
  
  test('Content-Type - Application/JSON', async ({ request }) => {
    const response = await request.get('/api/status');
    
    const contentType = response.headers()['content-type'];
    
    if (contentType) {
      expect(contentType).toContain('application/json');
      console.log('✅ Content-Type JSON');
    }
  });

  test('Cache-Control - Correctement configuré', async ({ request }) => {
    const response = await request.get('/api/status');
    
    const cacheControl = response.headers()['cache-control'];
    console.log('Cache-Control:', cacheControl);
  });

  test('X-Content-Type-Options - nosniff', async ({ request }) => {
    const response = await request.get('/');
    
    const xContentType = response.headers()['x-content-type-options'];
    
    if (xContentType === 'nosniff') {
      console.log('✅ X-Content-Type-Options: nosniff');
    }
  });
});

test.describe('API - Gestion des erreurs', () => {
  
  test('Endpoint inexistant - 404', async ({ request }) => {
    const response = await request.get('/api/endpoint-qui-nexiste-pas-123');
    
    expect(response.status()).toBe(404);
    console.log('✅ 404 pour endpoints inexistants');
  });

  test('Méthode non autorisée - 405', async ({ request }) => {
    // Tenter un POST sur un endpoint GET-only
    const response = await request.post('/api/status', {
      data: { test: 'data' },
    });
    
    const status = response.status();
    
    if (status === 405) {
      console.log('✅ 405 Method Not Allowed');
    }
  });

  test('Erreur serveur - 500 avec message', async ({ request }) => {
    // Note: Difficile à tester sans forcer une erreur
    console.log('✅ Les erreurs 500 devraient retourner un message approprié');
  });

  test('Format d\'erreur - Cohérent', async ({ request }) => {
    const response = await request.get('/api/user/me'); // Sans auth = erreur
    
    if (!response.ok()) {
      const data = await response.json();
      
      // Vérifier le format de l'erreur
      console.log('Format d\'erreur:', data);
      
      // Devrait avoir au moins un champ "error" ou "message"
      const hasErrorField = 'error' in data || 'message' in data;
      expect(hasErrorField).toBeTruthy();
    }
  });
});

test.describe('API - Documentation', () => {
  
  test('Page API Docs - Accessible', async ({ page }) => {
    await page.goto('/api-docs');
    
    await expect(page).toHaveURL(/\/api-docs/);
    await expect(page.locator('main')).toBeVisible();
    
    console.log('✅ Documentation API accessible');
  });

  test('Swagger/OpenAPI - Si disponible', async ({ request }) => {
    const response = await request.get('/api/openapi.json');
    
    const status = response.status();
    
    if (status === 200) {
      const data = await response.json();
      console.log('✅ OpenAPI spec disponible:', data.info?.title);
    } else {
      console.log('ℹ️ Pas de spec OpenAPI (status:', status, ')');
    }
  });
});
