import { Request, Response, NextFunction } from 'express';
import { verifyAccess, AuthUser } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token)
    return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
