import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createToken, makeAuthCookie, setCorsHeaders } from '../_lib/auth';

// Hardcoded admin credentials — only one admin
const ADMIN_EMAIL = 'visshubaghel@gmail.com';
const ADMIN_PASSWORD = 'chhotesahab';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token (expires in 7 days)
    const token = createToken({
      email: ADMIN_EMAIL,
      role: 'admin',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    // Set cookie
    res.setHeader('Set-Cookie', makeAuthCookie(token, 60 * 60 * 24 * 7));

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { name: 'Admin', email: ADMIN_EMAIL, role: 'admin' },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return Response.json(
      { message: 'Internal Server Error', detail: error.message },
      { status: 500 }
    );
  }
}
