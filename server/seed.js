import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with default users...');

  // Password hash
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash('password123', salt);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@antitalk.com' },
    update: { password_hash },
    create: {
      name: 'Super Admin',
      username: 'admin',
      email: 'admin@antitalk.com',
      password_hash,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.email);

  // 2. Create HR
  const hr = await prisma.user.upsert({
    where: { email: 'hr@antitalk.com' },
    update: { password_hash },
    create: {
      name: 'Sarah (HR Manager)',
      username: 'sarah_hr',
      email: 'hr@antitalk.com',
      password_hash,
      role: 'HR',
    },
  });
  console.log('HR user created:', hr.email);

  // 3. Create a default Job Role so HR has something to select
  await prisma.jobRole.create({
    data: {
      title: 'Senior Backend Engineer',
      department: 'Engineering',
      description: 'Responsible for building scalable Node.js microservices.',
      created_by: hr.id
    }
  });
  console.log('Seeded initial job role.');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
