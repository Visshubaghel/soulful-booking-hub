import { compare } from 'bcryptjs';
import connectToDatabase from '../_lib/db.js';
import { User } from '../_models/User.js';
import { createToken, makeAuthCookie } from '../_lib/auth.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body;

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Use Docis native auth token
    const token = createToken({
      userId: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      exp: Date.now() + 86400000 // 24h
    });

    res.setHeader('Set-Cookie', makeAuthCookie(token, 86400));

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'An error occurred.' });
  }
}
