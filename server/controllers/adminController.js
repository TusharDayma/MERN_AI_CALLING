import prisma from '../config/db.js';
import bcrypt from 'bcrypt';

// @desc Get Dashboard Metrics
// @route GET /api/admin/metrics
// @access Private (ADMIN)
export const getMetrics = async (req, res) => {
  try {
    const totalHRs = await prisma.user.count({ where: { role: 'HR', is_deleted: false } });
    const activeCampaigns = await prisma.campaign.count({ where: { status: 'ACTIVE' } });
    const completedCampaigns = await prisma.campaign.count({ where: { status: 'COMPLETED' } });
    
    // Mock metrics for AI stats (in reality, query candidates table)
    const aiUsage = 1450; 
    const aiCostSaved = 34500;
    const aiSuccessRate = 94;

    res.status(200).json({
      totalHRs,
      activeCampaigns,
      completedCampaigns,
      aiUsage,
      aiCostSaved,
      aiSuccessRate
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

// @desc Get all HR Users
// @route GET /api/admin/users
// @access Private (ADMIN)
export const getHRUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'HR', is_deleted: false },
      include: {
        _count: {
          select: { campaigns: true }
        }
      }
    });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch HR users' });
  }
};

// @desc Toggle HR Account Status
// @route PATCH /api/admin/users/:id/status
// @access Private (ADMIN)
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newStatus = user.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });

    res.status(200).json({ message: `User status changed to ${newStatus}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// @desc Delete HR User (Soft or Hard)
// @route DELETE /api/admin/users/:id
// @access Private (ADMIN)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.body;

    if (hardDelete) {
      // Must delete related records first or use cascading deletes in Prisma
      // Assuming cascade is set up or we just soft delete
      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ message: 'User permanently deleted' });
    } else {
      await prisma.user.update({
        where: { id },
        data: { is_deleted: true }
      });
      return res.status(200).json({ message: 'User soft deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// @desc Create HR User (Admin Bypass)
// @route POST /api/admin/users
// @access Private (ADMIN)
export const createHRUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { name, username, email, password_hash, role: 'HR' }
    });

    res.status(201).json({ message: 'HR User created', user: newUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// @desc Get Notifications (Password Resets)
// @route GET /api/admin/notifications
// @access Private (ADMIN)
export const getNotifications = async (req, res) => {
  try {
    const resets = await prisma.passwordReset.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json(resets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// @desc Resolve Password Reset
// @route POST /api/admin/notifications/:id/resolve
// @access Private (ADMIN)
export const resolvePasswordReset = async (req, res) => {
  try {
    const { id } = req.params;
    const { tempPassword } = req.body;

    const resetRequest = await prisma.passwordReset.findUnique({ where: { id } });
    if (!resetRequest) return res.status(404).json({ error: 'Request not found' });

    // Update password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    await prisma.user.update({
      where: { id: resetRequest.user_id },
      data: { password_hash }
    });

    // Mark resolved
    await prisma.passwordReset.update({
      where: { id },
      data: { status: 'RESOLVED' }
    });

    res.status(200).json({ message: 'Password reset resolved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve reset' });
  }
};
