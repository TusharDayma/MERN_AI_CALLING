export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Mock token verification
  const token = authHeader.split(' ')[1];
  req.user = { id: 'mock-user-id', role: token === 'admin-token' ? 'admin' : 'hr' };
  next();
};
