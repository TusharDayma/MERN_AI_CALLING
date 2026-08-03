import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../../config/db.js';

export const signupUser = async ({ name, username, email, password }) => {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  });

  if (existingUser) {
    const error = new Error('User with that email or username already exists');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      name,
      username,
      email,
      password_hash,
      role: 'HR'
    }
  });

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role
  };
};

export const signinUser = async ({ identifier, password }) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }]
    }
  });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 404;
    throw error;
  }

  if (user.status === 'DEACTIVATED' || user.is_deleted) {
    const error = new Error('Account is deactivated or deleted. Contact admin.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'super-secret-jwt-key-change-me-in-production',
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

export const createPasswordResetRequest = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return true; // Don't leak existing status

  await prisma.passwordReset.create({
    data: { user_id: user.id }
  });
  return true;
};

export const updateUserProfile = async (userId, { name, email, currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = { name, email };

  if (currentPassword && newPassword) {
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      const error = new Error('Incorrect current password');
      error.statusCode = 400;
      throw error;
    }
    const salt = await bcrypt.genSalt(10);
    updateData.password_hash = await bcrypt.hash(newPassword, salt);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role
  };
};
