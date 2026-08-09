import { createHRUser } from './src/modules/admin/admin.service.js';
import prisma from './config/db.js';

async function test() {
  try {
    const user = await createHRUser({
      name: 'hr',
      username: 'hr1',
      email: 'hr@test',
      password: 'password'
    });
    console.log("Created:", user);
  } catch (err) {
    console.error("Error creating user:", err);
    console.log("Error code:", err.code);
    console.log("Error meta:", err.meta);
  } finally {
    await prisma.$disconnect();
  }
}

test();
