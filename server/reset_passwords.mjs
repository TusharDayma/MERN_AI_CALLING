// One-off script: force-reset passwords for seeded users
import prisma from './config/db.js';
import bcrypt from 'bcrypt';

const hash = await bcrypt.hash('password123', 10);

const r1 = await prisma.user.updateMany({
  where: { email: 'hr@antitalk.com' },
  data: { password_hash: hash }
});
const r2 = await prisma.user.updateMany({
  where: { email: 'admin@antitalk.com' },
  data: { password_hash: hash }
});

console.log(`Updated HR user: ${r1.count} row(s)`);
console.log(`Updated Admin user: ${r2.count} row(s)`);
console.log('Password reset to "password123" for both users.');
await prisma.$disconnect();
