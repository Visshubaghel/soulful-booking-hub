import 'dotenv/config';
import connectToDatabase from '../api/_lib/db.js';
import { User } from '../api/_models/User.js';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();

    const email = 'visshubaghel@gmail.com';
    const password = 'chhotesahab';

    let admin = await User.findOne({ email });

    if (admin) {
      console.log('Admin user found. Updating password...');
      admin.password = await bcrypt.hash(password, 10);
      admin.role = 'admin';
      admin.name = 'Admin';
      await admin.save();
      console.log('Admin user updated successfully.');
    } else {
      console.log('Admin user not found. Creating new...');
      const hashedPassword = await bcrypt.hash(password, 10);
      admin = await User.create({
        name: 'Admin',
        email,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user created successfully.');
    }

    console.log(`Credentials:\nEmail: ${email}\nPassword: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
