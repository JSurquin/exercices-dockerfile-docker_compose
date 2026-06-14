import { test as setup } from '@playwright/test';

/**
 * L'endpoint /api/test/auth a été supprimé (sécurité pentest).
 * Les projets logged-in/admin nécessitent une autre stratégie d'auth E2E.
 */
setup.skip('authenticate as user', async () => {});
setup.skip('authenticate as admin', async () => {});
