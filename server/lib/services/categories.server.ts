import { asc } from 'drizzle-orm';
import { db } from '@server/lib/db';
import { categories } from '@db/schema';

export async function listCategories() {
  return db.query.categories.findMany({
    orderBy: [asc(categories.label)],
  });
}
