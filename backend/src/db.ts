import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/reportgen';
  await mongoose.connect(uri);
  console.log('✅  MongoDB connected');
  await seedUsers();
}

async function seedUsers() {
  const seeds = [
    { name: 'Admin',        email: 'admin@reportgen.com', password: 'admin123', role: 'admin' as const },
    { name: 'Regular User', email: 'user@reportgen.com',  password: 'user123',  role: 'user'  as const },
  ];
  for (const s of seeds) {
    if (!(await User.findOne({ email: s.email }))) {
      await User.create({ name: s.name, email: s.email, passwordHash: await bcrypt.hash(s.password, 12), role: s.role });
      console.log(`  ↳ Seeded ${s.email}`);
    }
  }
}
