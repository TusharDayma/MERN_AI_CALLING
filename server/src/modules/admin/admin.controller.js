import * as adminService from './admin.service.js';

export const getMetrics = async (req, res) => {
  try {
    const metrics = await adminService.getAdminMetrics();
    res.status(200).json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

export const getHealth = async (req, res) => {
  try {
    const healthData = await adminService.getSystemHealth();
    res.status(200).json(healthData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { newStatus } = await adminService.toggleUserStatus(req.params.id);
    res.status(200).json({ message: `User status changed to ${newStatus}` });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update status' });
  }
};

export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const result = await adminService.changeUserRole(req.params.id, role);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update role' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = await adminService.deleteUser(req.params.id, req.body.hardDelete);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const createHRUser = async (req, res) => {
  try {
    const user = await adminService.createHRUser(req.body);
    res.status(201).json({ message: 'HR User created', user });
  } catch (err) {
    if (err.code === 'P2002') {
      const target = err.meta?.target || 'Field';
      return res.status(400).json({ error: `A user with this ${target} already exists.` });
    }
    res.status(500).json({ error: err.message || 'Failed to create user. Please check your inputs.' });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await adminService.getPendingNotifications();
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const resolvePasswordReset = async (req, res) => {
  try {
    const result = await adminService.resolvePasswordReset(req.params.id, req.body.tempPassword);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to resolve reset' });
  }
};

export const updateUserCredits = async (req, res) => {
  try {
    const { credits } = req.body;
    const user = await adminService.updateUserCredits(req.params.id, credits);
    res.status(200).json({ message: 'Credits updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user credits' });
  }
};
