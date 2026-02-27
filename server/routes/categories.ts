import { Hono } from 'hono';
import { db } from '@server/lib/db';
import { categories } from '@db/schema';
import { asc } from 'drizzle-orm';

const app = new Hono();

// GET /api/categories - List all categories (public, no auth required)
app.get('/', async (c) => {
  const items = await db.query.categories.findMany({
    orderBy: [asc(categories.label)],
  });

  return c.json({ items });
});

export default app;
export type CategoriesApp = typeof app;
