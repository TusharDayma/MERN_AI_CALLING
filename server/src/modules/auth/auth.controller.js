import * as authService from './auth.service.js';

export const signup = async (req, res) => {
  try {
    const user = await authService.signupUser(req.body);
    res.status(201).json({
      message: 'HR Account created successfully',
      user
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Server error during signup' });
  }
};

export const signin = async (req, res) => {
  try {
    const data = await authService.signinUser(req.body);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Server error during signin' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    await authService.createPasswordResetRequest(req.body.email);
    res.status(200).json({ message: 'If that email exists, a reset request has been logged.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error processing forgot password' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await authService.updateUserProfile(req.user.id, req.body);
    res.status(200).json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update profile' });
  }
};
