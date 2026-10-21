import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/),
    password: z.string().min(8),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Passwords do not match',
  });

router.post('/register', authLimiter(), async (req, res) => {
  const body = registerSchema.parse(req.body);
  const [exists] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, body.username));
  if (exists) return res.status(409).json({ error: 'Username already taken' });

  const [user] = await db
    .insert(users)
    .values({
      username: body.username,
      password_hash: await bcrypt.hash(body.password, 10),
    })
    .returning({
      id: users.id,
      username: users.username,
      created_at: users.created_at,
    });

  res.status(201).json(user);
});

const loginSchema = z.object({ username: z.string(), password: z.string() });

router.post('/login', authLimiter(), async (req, res) => {
  const body = loginSchema.parse(req.body);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, body.username));
  if (!user || !(await bcrypt.compare(body.password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid username or password' });

  const payload = { id: user.id, username: user.username };
  res.json({
    authentication_token: signAccess(payload),
    refresh_token: signRefresh(payload),
  });
});

router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = z
      .object({ refresh_token: z.string() })
      .parse(req.body);
    const { id, username } = verifyRefresh(refresh_token);
    res.json({ authentication_token: signAccess({ id, username }) });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
