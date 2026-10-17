import { revalidateTag } from 'next/cache';

export function invalidatePublicCatalog() {
  revalidateTag('public-catalog');
}
