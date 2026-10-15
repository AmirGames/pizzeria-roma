import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  use: { baseURL: 'http://localhost:3200', browserName: 'chromium' },
  webServer: { command: 'npm run start -- -p 3200', url: 'http://localhost:3200/gerant/connexion', timeout: 60000, env: { APP_ORIGIN: 'http://localhost:3200' } },
});
