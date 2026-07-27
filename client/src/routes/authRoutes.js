import express from 'express';

const router = express.Router();

router.post('/signup', (req, res) => {
  res.status(201).json({ message: 'User created (mock)' });
});

router.post('/signin', (req, res) => {
  res.status(200).json({ token: 'mock-jwt-token' });
});

export default router;
