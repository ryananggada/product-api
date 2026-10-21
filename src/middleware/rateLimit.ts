import rateLimit from 'express-rate-limit';

const handler = (msg: string) => (_req: any, res: any) =>
  res.status(429).json({ error: msg });

export const writeLimiter = () =>
  rateLimit({
    windowMs: 5_000,
    limit: 1,
    keyGenerator: (req) => String(req.user!.id),
    handler: handler('Too many requests, wait 5 seconds'),
  });

export const authLimiter = () =>
  rateLimit({
    windowMs: 60_000,
    limit: 3,
    handler: handler('Too many attempts, try again in a minute'),
  });
