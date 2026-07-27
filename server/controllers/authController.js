import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

// @desc Register new HR user
// @route POST /api/auth/signup
// @access Public (Always creates HR role)
export const signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with that email or username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user (strictly HR role as per requirements)
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password_hash,
        role: 'HR' // Hardcoded rule
      }
    });

    res.status(201).json({
      message: 'HR Account created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

// @desc Sign In user
// @route POST /api/auth/signin
// @access Public
export const signin = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'DEACTIVATED' || user.is_deleted) {
      return res.status(403).json({ error: 'Account is deactivated or deleted. Contact admin.' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'super-secret-jwt-key-change-me-in-production',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during signin' });
  }
};

// @desc Request Password Reset
// @route POST /api/auth/forgot-password
// @access Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak whether user exists for security reasons
      return res.status(200).json({ message: 'If that email exists, a reset request has been logged.' });
    }

    // Create reset request
    await prisma.passwordReset.create({
      data: {
        user_id: user.id
      }
    });

    res.status(200).json({ message: 'If that email exists, a reset request has been logged.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error processing forgot password' });
  }
};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
export const updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updateData = { name, email };

    // Handle password change
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password' });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(newPassword, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
       return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
