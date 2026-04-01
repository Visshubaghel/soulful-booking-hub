import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_only_for_dev';

export interface JwtPayload {
  userId: string;
  role: 'admin' | 'user';
  email: string;
}

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

export function verifyAdmin(req: VercelRequest, res: VercelResponse): JwtPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ message: 'Unauthorized: no token' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden: admin only' });
      return null;
    }
    return decoded;
  } catch {
    res.status(401).json({ message: 'Unauthorized: invalid token' });
    return null;
  }
}

export function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
