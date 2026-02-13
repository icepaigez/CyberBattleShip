import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { gameDatabase } from '../services/Database.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Debug: Log whether ADMIN_PASSWORD is set (don't log the actual password)
if (!ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_PASSWORD not set or empty in environment');
} else {
  console.log('✅ ADMIN_PASSWORD is configured');
}

function getSessionToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  return cookieHeader?.split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === SESSION_COOKIE)?.[1];
}

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!ADMIN_PASSWORD) {
    res.status(500).json({ error: 'Admin auth not configured (ADMIN_PASSWORD missing)' });
    return;
  }

  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const expiresAt = await gameDatabase.getAdminSession(token);
  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    if (expiresAt) await gameDatabase.deleteAdminSession(token);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

export async function login(req: Request, res: Response): Promise<void> {
  if (!ADMIN_PASSWORD) {
    res.status(500).json({ error: 'Admin auth not configured' });
    return;
  }

  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  await gameDatabase.deleteExpiredAdminSessions();
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
  await gameDatabase.saveAdminSession(token, expiresAt);

  const isProd = process.env.NODE_ENV === 'production';
  res
    .cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: SESSION_MAX_AGE_MS,
      path: '/',
    })
    .json({ ok: true });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = getSessionToken(req);
  if (token) await gameDatabase.deleteAdminSession(token);
  res.clearCookie(SESSION_COOKIE, { path: '/' }).json({ ok: true });
}
