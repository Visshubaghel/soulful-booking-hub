import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: Record<string, string> = {};

  // Test crypto (Node built-in)
  try {
    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', 'test').update('data').digest('base64url');
    results.crypto = 'OK: ' + hmac.substring(0, 10);
  } catch (e: any) {
    results.crypto = 'FAIL: ' + e.message;
  }

  // Test import of our auth lib
  try {
    const { createToken, verifyToken } = await import('./_lib/auth');
    const token = createToken({ test: true, exp: Date.now() + 60000 });
    const verified = verifyToken(token);
    results.auth_lib = verified ? 'OK' : 'VERIFY_FAILED';
    results.token_sample = token.substring(0, 20) + '...';
  } catch (e: any) {
    results.auth_lib = 'FAIL: ' + e.message;
  }

  // Test req.body parsing
  if (req.method === 'POST') {
    results.body = JSON.stringify(req.body || 'null');
    results.contentType = req.headers['content-type'] || 'missing';
  }

  results.method = req.method || 'unknown';
  results.JWT_SECRET_set = String(!!process.env.JWT_SECRET);
  results.NODE_ENV = process.env.NODE_ENV || 'unset';

  return res.status(200).json(results);
}
