import { hash } from 'bcryptjs';
import connectToDatabase from '../_lib/db.js';
import { User } from '../_models/User.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, password, name } = req.body;

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      name: name || 'User',
      role: 'admin' // Or whatever role logic is needed
    });

    return res.status(201).json({ message: 'User created.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'An error occurred.' });
  }
}
