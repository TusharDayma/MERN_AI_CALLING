import * as adminService from './admin.service.js';

export const getMetrics = async (req, res) => {
  try {
    const metrics = await adminService.getAdminMetrics();
    res.status(200).json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

export const getHRUsers = async (req, res) => {
  try {
    const users = await adminService.getHRUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch HR users' });
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
    res.status(500).json({ error: 'Failed to create user' });
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
