import crypto from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SECRET = process.env.JWT_SECRET || 'docis_fallback_secret_2026';

// ── Simple HMAC token (Node built-in crypto, zero external deps) ──

export function createToken(payload: Record<string, any>): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token: string): Record<string, any> | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Token extraction from request ──

export function getTokenFromRequest(req: VercelRequest): string | null {
  // Try cookie first
  const cookieHeader = req.headers.cookie || '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)auth=([^;]+)/);
  if (cookieMatch) return cookieMatch[1];

  // Fallback: Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

// ── Admin verification ──

export function verifyAdmin(req: VercelRequest, res: VercelResponse): Record<string, any> | null {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ message: 'Unauthorized: no token' });
    return null;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ message: 'Unauthorized: invalid or expired token' });
    return null;
  }
  if (payload.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden: admin only' });
    return null;
  }
  return payload;
}

// ── Cookie helper (no external cookie lib) ──

export function makeAuthCookie(token: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

// ── CORS ──

export function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
