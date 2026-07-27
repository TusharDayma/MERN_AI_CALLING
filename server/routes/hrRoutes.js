import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { 
  getHRMetrics, 
  getJobRoles, 
  createJobRole, 
  createCampaign, 
  addCandidates,
  addQuestions,
  launchCampaign, 
  getCandidatesRanking,
  getCampaigns,
  getCampaignDetails,
  toggleCampaignStatus,
  deleteCampaign
} from '../controllers/hrController.js';

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('HR'));

router.get('/metrics', getHRMetrics);

router.get('/job-roles', getJobRoles);
router.post('/job-roles', createJobRole);

// Campaigns
router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);
router.get('/campaigns/:id', getCampaignDetails);
router.patch('/campaigns/:id/status', toggleCampaignStatus);
router.delete('/campaigns/:id', deleteCampaign);
router.post('/campaigns/:id/candidates', addCandidates);
router.post('/campaigns/:id/questions', addQuestions);
router.post('/campaigns/:id/launch', launchCampaign);

router.get('/candidates', getCandidatesRanking);

export default router;
