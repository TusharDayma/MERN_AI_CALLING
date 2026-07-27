import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: 'Access Denied: No token provided' });
    }

    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trimLeft();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key-change-me-in-production');
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid Token' });
  }
};
