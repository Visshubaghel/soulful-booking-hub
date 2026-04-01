import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as bcryptjs from 'bcryptjs';
import * as jsonwebtoken from 'jsonwebtoken';
import * as cookiePkg from 'cookie';
import connectToDatabase from '../_lib/db';
import { User } from '../_models/User';

const bcrypt = (bcryptjs as any).default || bcryptjs;
const jwt = (jsonwebtoken as any).default || jsonwebtoken;
const { serialize } = (cookiePkg as any).default || cookiePkg;

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_only_for_dev';

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Role logic: specific admin email grants admin role
    const role = normalizedEmail === 'visshubaghel@gmail.com' ? 'admin' : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    await newUser.save();

    // Auto-login: generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cookie = serialize('auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error: any) {
    console.error("Registration Error", error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
