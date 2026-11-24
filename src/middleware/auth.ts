import type { NextFunction, Request, Response } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateProfile } from '../db/repository.ts';
import type { Profile } from '../types/campuscycle.ts';

export interface AuthedRequest extends Request {
  user?: Profile;
  firebaseUid?: string;
}

const ALLOWED_COLLEGE_DOMAIN = (process.env.ALLOWED_COLLEGE_DOMAIN || '')
  .trim()
  .toLowerCase();

export function extractBearer(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

export async function resolveAuthedProfile(
  req: Request
): Promise<Profile | null> {
  const token = extractBearer(req);
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (decoded.email || '').trim().toLowerCase();
    if (!email) return null;
    if (ALLOWED_COLLEGE_DOMAIN && !email.endsWith(ALLOWED_COLLEGE_DOMAIN)) {
      return null;
    }

    const profile = await getOrCreateProfile({
      uid: decoded.uid,
      email,
      fullName:
        (typeof decoded.name === 'string' && decoded.name.trim()) ||
        email.split('@')[0],
      emailVerified: Boolean(decoded.email_verified),
    });

    if (!profile.isActive) return null;
    return profile;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch (err) {
    console.error('Firebase token verification failed:', err);
    res
      .status(401)
      .json({ error: 'Invalid or expired session. Please sign in again.' });
    return;
  }

  const email = (decoded.email || '').trim().toLowerCase();
  if (!email) {
    res.status(401).json({ error: 'Authenticated account must include an email.' });
    return;
  }
  if (ALLOWED_COLLEGE_DOMAIN && !email.endsWith(ALLOWED_COLLEGE_DOMAIN)) {
    res.status(403).json({
      error: `Access requires a verified ${ALLOWED_COLLEGE_DOMAIN} college email.`,
    });
    return;
  }

  try {
    const profile = await getOrCreateProfile({
      uid: decoded.uid,
      email,
      fullName:
        (typeof decoded.name === 'string' && decoded.name.trim()) ||
        email.split('@')[0],
      emailVerified: Boolean(decoded.email_verified),
    });

    if (!profile.isActive) {
      res.status(403).json({
        error: 'Your account has been suspended by a CampusCycle administrator.',
      });
      return;
    }

    req.user = profile;
    req.firebaseUid = decoded.uid;
    next();
  } catch (error) {
    console.error('Failed to sync profile in requireAuth:', error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: 'Unable to load user profile. Please retry.' });
    }
  }
}

export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let authed = false;
  await requireAuth(req, res, () => {
    authed = true;
  });
  if (!authed || res.headersSent) return;

  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin privileges required.' });
    return;
  }
  next();
}
