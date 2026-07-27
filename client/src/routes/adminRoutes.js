import express from 'express';

const router = express.Router();

router.get('/metrics', (req, res) => {
  res.status(200).json({ users: 150, campaigns: 42 });
});

export default router;
