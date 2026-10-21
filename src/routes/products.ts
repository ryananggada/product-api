import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '../db';
import { products } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimit';
import { cache } from '../lib/cache';

const router = Router();

const idParam = z.object({ id: z.coerce.number().int().positive() });

const listQuery = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  page: z.coerce.number().int().min(1).default(1),
});

const createSchema = z.object({
  title: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
  category: z.string().min(1),
  images: z.array(z.string().url()).min(1),
});
const updateSchema = createSchema.partial();

router.get('/', async (req, res) => {
  const q = listQuery.parse(req.query);
  const key = `products:${JSON.stringify(q)}`;
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const where = and(
    q.search ? ilike(products.title, `%${q.search}%`) : undefined,
    q.category ? eq(products.category, q.category) : undefined,
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.id))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
  ]);

  const result = {
    data,
    meta: {
      page: q.page,
      limit: q.limit,
      total,
      total_pages: Math.ceil(total / q.limit),
    },
  };
  cache.set(key, result);
  res.json(result);
});

router.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  const key = `product:${id}`;
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return res.status(404).json({ error: 'Product not found' });

  cache.set(key, product);
  res.json(product);
});

router.post('/', requireAuth, writeLimiter(), async (req, res) => {
  const body = createSchema.parse(req.body);
  const { id, username } = req.user!;

  const [product] = await db
    .insert(products)
    .values({
      ...body,
      created_by: username,
      created_by_id: id,
      updated_by: username,
      updated_by_id: id,
    })
    .returning();

  cache.clear();
  res.status(201).json(product);
});

router.put('/:id', requireAuth, writeLimiter(), async (req, res) => {
  const { id } = idParam.parse(req.params);
  const body = updateSchema.parse(req.body);
  const user = req.user!;

  const [product] = await db
    .update(products)
    .set({
      ...body,
      updated_at: sql`now()` as any,
      updated_by: user.username,
      updated_by_id: user.id,
    })
    .where(eq(products.id, id))
    .returning();

  if (!product) return res.status(404).json({ error: 'Product not found' });
  cache.clear();
  res.json(product);
});

router.delete('/:id', requireAuth, writeLimiter(), async (req, res) => {
  const { id } = idParam.parse(req.params);
  const [deleted] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning({ id: products.id });
  if (!deleted) return res.status(404).json({ error: 'Product not found' });
  cache.clear();
  res.json({ message: 'Product deleted', id: deleted.id });
});

export default router;
