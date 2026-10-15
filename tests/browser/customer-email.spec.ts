import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { capturedLink } from '../helpers/mailpit.mjs';
const prisma = new PrismaClient();
let email: string;
test.afterEach(async () => { if (email) await prisma.user.deleteMany({ where: { email } }); });
test.afterAll(async () => prisma.$disconnect());
test('a customer verifies their email and recovers their password using the local mailbox', async ({ page }) => {
  if (process.env.RUN_DATABASE_TESTS !== '1' || !new URL(process.env.DATABASE_URL!).pathname.endsWith('_test')) throw new Error('Dedicated test database required');
  email = `browser-email-${randomUUID()}@example.test`;
  await page.goto('/compte');
  await page.getByRole('button', { name: 'Créer un compte', exact: true }).click();
  await page.getByLabel('Votre nom').fill('Email navigateur');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill('Initial-browser-password');
  await page.getByRole('button', { name: 'Créer mon compte de test' }).click();
  await expect(page.getByText('Adresse e-mail non vérifiée', { exact: true })).toBeVisible();
  await page.goto(await capturedLink(email, '/compte/verifier'));
  await expect(page).toHaveURL(/\/compte\/verifier$/);
  await page.getByRole('button', { name: 'Confirmer mon e-mail' }).click();
  await expect(page.getByText('Votre adresse e-mail est vérifiée.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Retour à mon espace client' }).click();
  await expect(page.getByText('Adresse e-mail vérifiée', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await page.getByRole('link', { name: 'Mot de passe oublié ?' }).click();
  await expect(page.getByRole('heading', { name: 'Mot de passe oublié', exact: true })).toBeVisible();
  await page.getByLabel('Adresse e-mail').fill(email);
  const [recovery] = await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/customer/email/request') && response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Demander un lien de réinitialisation' }).click(),
  ]);
  expect(recovery.status(), JSON.stringify({ origin: recovery.request().headers().origin, form: await page.locator('form').innerText() })).toBe(200);
  await expect(page.getByText('Si un compte peut recevoir cet e-mail', { exact: false })).toBeVisible();
  await page.goto(await capturedLink(email, '/compte/reinitialiser'));
  await expect(page).toHaveURL(/\/compte\/reinitialiser$/);
  await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('Recovered-browser-password');
  await page.getByLabel('Confirmer le nouveau mot de passe', { exact: true }).fill('Recovered-browser-password');
  await page.getByRole('button', { name: 'Réinitialiser mon mot de passe' }).click();
  await expect(page.getByText('Votre mot de passe a été réinitialisé.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Retour à mon espace client' }).click();
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill('Recovered-browser-password');
  await page.getByRole('button', { name: 'Ouvrir mon espace' }).click();
  await expect(page.getByRole('heading', { name: 'Bonjour Email navigateur' })).toBeVisible();
});
