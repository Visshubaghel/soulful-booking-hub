import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import connectToDatabase from '../_lib/db';
import { User } from '../_models/User';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Role logic: specific admin email grants admin role
    const role = email === 'visshubaghel@gmail.com' ? 'admin' : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    return res.status(201).json({ message: 'User created successfully', user: { name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (error) {
    console.error("Registration Error", error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
