import { PrismaClient } from '@prisma/client';
import { menu20261014 } from './menu-2026-10-14.mjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async tx => {
    for (const category of menu20261014) {
      await tx.menuCategory.upsert({
        where: { id: category.id },
        create: {
          id: category.id,
          nameFr: category.nameFr,
          nameEn: category.nameEn,
          fulfillmentCategory: category.fulfillmentCategory,
          position: category.position,
        },
        update: {
          nameFr: category.nameFr,
          nameEn: category.nameEn,
          fulfillmentCategory: category.fulfillmentCategory,
          position: category.position,
        },
      });

      for (const product of category.products) {
        await tx.product.upsert({
          where: { id: product.id },
          create: {
            id: product.id,
            categoryId: category.id,
            nameFr: product.nameFr,
            nameEn: product.nameEn,
            active: product.active,
            baseCents: product.baseCents,
            choiceLabel: product.choiceLabel ?? null,
            extraSelectionMode: product.extraSelectionMode ?? 'MULTIPLE',
          },
          update: {
            categoryId: category.id,
            nameFr: product.nameFr,
            nameEn: product.nameEn,
            active: product.active,
            baseCents: product.baseCents,
            choiceLabel: product.choiceLabel ?? null,
            extraSelectionMode: product.extraSelectionMode ?? 'MULTIPLE',
          },
        });

        // This seed owns option rows for its stable menu product IDs.
        await tx.productSize.deleteMany({ where: { productId: product.id, id: { startsWith: 'menu-20261014-size-' } } });
        await tx.productExtra.deleteMany({ where: { productId: product.id, id: { startsWith: 'menu-20261014-extra-' } } });
        if (product.sizes.length) {
          await tx.productSize.createMany({
            data: product.sizes.map(option => ({ ...option, productId: product.id })),
          });
        }
        if (product.extras.length) {
          await tx.productExtra.createMany({
            data: product.extras.map(option => ({ ...option, productId: product.id })),
          });
        }
      }
    }
  });
  console.log(`Menu 2026-10-14 synchronisé : ${menu20261014.reduce((sum, category) => sum + category.products.length, 0)} produits.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
