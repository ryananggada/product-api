import jwt from 'jsonwebtoken';

export type AuthUser = { id: number; username: string };

export const signAccess = (u: AuthUser) =>
  jwt.sign(u, process.env.JWT_SECRET!, { expiresIn: '15m' });
export const signRefresh = (u: AuthUser) =>
  jwt.sign(u, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
export const verifyAccess = (t: string) =>
  jwt.verify(t, process.env.JWT_SECRET!) as AuthUser;
export const verifyRefresh = (t: string) =>
  jwt.verify(t, process.env.JWT_REFRESH_SECRET!) as AuthUser;
