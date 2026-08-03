import prisma from '../../../config/db.js';
import bcrypt from 'bcrypt';

export const getAdminMetrics = async () => {
  const totalHRs = await prisma.user.count({ where: { role: 'HR', is_deleted: false } });
  const activeCampaigns = await prisma.campaign.count({ where: { status: 'ACTIVE' } });
  const completedCampaigns = await prisma.campaign.count({ where: { status: 'COMPLETED' } });

  return {
    totalHRs,
    activeCampaigns,
    completedCampaigns,
    aiUsage: 1450,
    aiCostSaved: 34500,
    aiSuccessRate: 94
  };
};

export const getHRUsers = async () => {
  return await prisma.user.findMany({
    where: { role: 'HR', is_deleted: false },
    include: {
      _count: {
        select: { campaigns: true }
      }
    }
  });
};

export const toggleUserStatus = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const newStatus = user.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
  await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus }
  });

  return { newStatus };
};

export const deleteUser = async (userId, hardDelete = false) => {
  if (hardDelete) {
    await prisma.user.delete({ where: { id: userId } });
    return { message: 'User permanently deleted' };
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { is_deleted: true }
    });
    return { message: 'User soft deleted' };
  }
};

export const createHRUser = async ({ name, username, email, password }) => {
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  return await prisma.user.create({
    data: { name, username, email, password_hash, role: 'HR' }
  });
};

export const getPendingNotifications = async () => {
  return await prisma.passwordReset.findMany({
    where: { status: 'PENDING' },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { created_at: 'desc' }
  });
};

export const resolvePasswordReset = async (resetId, tempPassword) => {
  const resetRequest = await prisma.passwordReset.findUnique({ where: { id: resetId } });
  if (!resetRequest) {
    const error = new Error('Request not found');
    error.statusCode = 404;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(tempPassword, salt);

  await prisma.user.update({
    where: { id: resetRequest.user_id },
    data: { password_hash }
  });

  await prisma.passwordReset.update({
    where: { id: resetId },
    data: { status: 'RESOLVED' }
  });

  return { message: 'Password reset resolved successfully.' };
};
