import express from 'express';
import * as campaignController from './campaign.controller.js';
import { importCandidates } from '../candidates/candidate.controller.js';
import { verifyToken } from '../../../middleware/authMiddleware.js';
import { requireRole } from '../../../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('HR'));

router.get('/metrics', campaignController.getHRMetrics);
router.get('/job-roles', campaignController.getJobRoles);
router.post('/job-roles', campaignController.createJobRole);

router.get('/', campaignController.getCampaigns);
router.post('/', campaignController.createCampaign);
router.get('/:id', campaignController.getCampaignDetails);
router.post('/:id/questions', campaignController.addQuestions);
router.post('/:id/launch', campaignController.launchCampaign);
router.post('/:id/candidates', importCandidates);
router.delete('/:id', campaignController.deleteCampaign);

export default router;
