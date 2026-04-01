import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, makeAuthCookie } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Clear the auth cookie
  res.setHeader('Set-Cookie', makeAuthCookie('', 0));
  return res.status(200).json({ message: 'Logged out successfully' });
}
