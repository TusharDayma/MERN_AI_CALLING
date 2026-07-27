import express from 'express';

const router = express.Router();

router.post('/campaigns', (req, res) => {
  res.status(201).json({ message: 'Campaign created (mock)' });
});

export default router;
