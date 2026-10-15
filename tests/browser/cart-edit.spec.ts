import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let categoryId: string;
let productId: string;
let smallId: string;
let extraId: string;
let initial: Array<{ productId: string; sizeId: string; extraIds: string[]; removedIngredients?: string[]; quantity: number }>;
const storageKey = 'pizzeria-roma-catalog-cart-v1';

test.beforeEach(async ({ page }) => {
  if (process.env.RUN_DATABASE_TESTS !== '1' || !new URL(process.env.DATABASE_URL!).pathname.endsWith('_test')) throw new Error('Dedicated *_test database and RUN_DATABASE_TESTS=1 required');
  const category = await prisma.menuCategory.create({ data: { nameFr: 'Test navigateur', nameEn: 'Browser test', fulfillmentCategory: 'PIZZA' } });
  categoryId = category.id;
  const product = await prisma.product.create({ data: {
    categoryId, nameFr: 'Pizza navigateur', nameEn: 'Browser pizza', baseCents: 0, removableIngredients: ['Tomate'],
    sizes: { create: [{ label: '33 cm', priceCents: 1200 }, { label: '50 cm', priceCents: 2400 }] },
  }, include: { sizes: true } });
  productId = product.id;
  smallId = product.sizes.find(size => size.label === '33 cm')!.id;
  const largeId = product.sizes.find(size => size.label === '50 cm')!.id;
  const extra = await prisma.productExtra.create({ data: { productId, nameFr: 'Chèvre', nameEn: 'Goat cheese', priceCents: 0, sizePrices: { [smallId]: 150, [largeId]: 300 } } });
  extraId = extra.id;
  initial = [
    { productId, sizeId: smallId, extraIds: [extraId], removedIngredients: ['Tomate'], quantity: 2 },
    { productId, sizeId: smallId, extraIds: [], quantity: 1 },
  ];
  await page.addInitScript(({ storageKey, initial }) => localStorage.setItem(storageKey, JSON.stringify(initial)), { storageKey, initial });
  await page.goto('/panier');
  await expect(page.getByRole('button', { name: 'Modifier les options de Pizza navigateur' }).first()).toBeVisible();
});
test.afterEach(async () => {
  if (categoryId) { await prisma.product.deleteMany({ where: { categoryId } }); await prisma.menuCategory.delete({ where: { id: categoryId } }); }
});
test.afterAll(async () => prisma.$disconnect());

test('edit saves the verified recipe, preserves quantity and merges equivalent lines', async ({ page }) => {
  await page.getByRole('button', { name: 'Modifier les options de Pizza navigateur' }).first().click();
  await expect(page.getByLabel('Sans Tomate')).toBeChecked();
  await page.getByLabel('Sans Tomate').uncheck();
  await page.getByLabel(/Chèvre/).uncheck();
  await page.getByRole('button', { name: 'Enregistrer la recette' }).click();
  await expect(page.getByRole('heading', { name: 'Modifier la recette' })).toHaveCount(0);
  await expect(page.locator('.roma-qty output')).toHaveText('3');
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey)).toEqual([{ productId, sizeId: smallId, extraIds: [], quantity: 3 }]);
});

test('cancelling leaves the stored recipe unchanged', async ({ page }) => {
  const before = await page.evaluate(key => localStorage.getItem(key), storageKey);
  await page.getByRole('button', { name: 'Modifier les options de Pizza navigateur' }).first().click();
  await page.getByLabel('Sans Tomate').uncheck();
  await page.getByRole('button', { name: 'Annuler' }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(before);
});

test('an external cart change cannot be overwritten by an edit already in progress', async ({ page }) => {
  await page.getByRole('button', { name: 'Modifier les options de Pizza navigateur' }).first().click();
  await expect(page.getByLabel('Sans Tomate')).toBeVisible();
  const changed = initial.map((line, index) => index === 0 ? { ...line, quantity: 4 } : line);
  await page.evaluate(({ storageKey, changed }) => {
    localStorage.setItem(storageKey, JSON.stringify(changed));
    window.dispatchEvent(new StorageEvent('storage', { key: storageKey }));
  }, { storageKey, changed });
  await expect(page.locator('.roma-qty output').first()).toHaveText('4');
  await page.getByLabel('Sans Tomate').uncheck();
  await page.getByRole('button', { name: 'Enregistrer la recette' }).click();
  await expect(page.getByRole('alert')).toContainText('Le panier a changé');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey)).toEqual(changed);
});
